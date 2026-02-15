import inquirer from 'inquirer';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChoicePrompt } from '../prompts/index';
import { TextPrompt } from '../prompts/text-prompt';

// Mock inquirer
vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn(),
  },
}));

// Mock readline - use factory function to avoid hoisting issues
vi.mock('readline', () => {
  return {
    createInterface: vi.fn(() => ({
      close: vi.fn(),
    })),
  };
});

describe('ChoicePrompt', () => {
  let mockStdin: any;
  let mockStdout: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock process.stdin and process.stdout
    mockStdin = {
      isTTY: true,
      setRawMode: vi.fn(),
      on: vi.fn(),
      removeListener: vi.fn(),
    };
    mockStdout = {
      write: vi.fn(),
    };
    Object.defineProperty(process, 'stdin', {
      value: mockStdin,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(process, 'stdout', {
      value: mockStdout,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Non-searchable prompt', () => {
    it('should use inquirer for non-searchable prompt', async () => {
      const prompt = new ChoicePrompt(false);
      const options = [
        { id: '1', label: 'Option 1' },
        { id: '2', label: 'Option 2' },
      ];

      (inquirer.prompt as any).mockResolvedValueOnce({ choice: '1' });

      const result = await prompt.prompt('Select option', options);

      expect(inquirer.prompt).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'list',
          name: 'choice',
          choices: [
            { name: 'Option 1', value: '1' },
            { name: 'Option 2', value: '2' },
          ],
        }),
      ]);
      expect(result).toEqual({ id: '1', label: 'Option 1' });
    });

    it('should throw error if invalid choice is returned', async () => {
      const prompt = new ChoicePrompt(false);
      const options = [{ id: '1', label: 'Option 1' }];

      (inquirer.prompt as any).mockResolvedValueOnce({ choice: 'invalid' });

      await expect(prompt.prompt('Select option', options)).rejects.toThrow(
        'Invalid choice: invalid'
      );
    });

    it('should handle empty options list', async () => {
      const prompt = new ChoicePrompt(false);
      const options: Array<{ id: string; label: string }> = [];

      (inquirer.prompt as any).mockResolvedValueOnce({ choice: undefined });

      await expect(prompt.prompt('Select option', options)).rejects.toThrow();
    });
  });

  describe('Searchable prompt', () => {
    it('should initialize readline interface for searchable prompt', async () => {
      const prompt = new ChoicePrompt(true);
      const options = [
        { id: '1', label: 'Option 1' },
        { id: '2', label: 'Option 2' },
      ];

      // Set up mock to resolve immediately with Enter key
      let dataHandler: ((key: Buffer) => void) | null = null;
      mockStdin.on.mockImplementation((event: string, handler: (key: Buffer) => void) => {
        if (event === 'data') {
          dataHandler = handler;
          // Immediately trigger Enter key
          setTimeout(() => {
            if (dataHandler) {
              dataHandler(Buffer.from('\r'));
            }
          }, 10);
        }
      });

      // Start the prompt (it will wait for input)
      const result = await prompt.prompt('Select option', options);

      // Verify readline was created
      const readline = await import('readline');
      expect(readline.createInterface).toHaveBeenCalledWith({
        input: mockStdin,
        output: mockStdout,
        terminal: false,
      });

      // Verify raw mode was set
      expect(mockStdin.setRawMode).toHaveBeenCalledWith(true);

      // In-place mode: cursor hidden only, no alternate screen (1049h/1049l)
      expect(mockStdout.write).toHaveBeenCalledWith('\x1B[?25l');

      expect(result).toEqual({ id: '1', label: 'Option 1' });
      // Verify cleanup: cursor restored only (no 1049l)
      expect(mockStdout.write).toHaveBeenCalledWith('\x1B[?25h');
      expect(mockStdout.write).not.toHaveBeenCalledWith('\x1B[?1049h');
      expect(mockStdout.write).not.toHaveBeenCalledWith('\x1B[?1049l');
    });

    it('should handle arrow key navigation', async () => {
      const prompt = new ChoicePrompt(true);
      const options = [
        { id: '1', label: 'Option 1' },
        { id: '2', label: 'Option 2' },
        { id: '3', label: 'Option 3' },
      ];

      let dataHandler: ((key: Buffer) => void) | null = null;
      mockStdin.on.mockImplementation((event: string, handler: (key: Buffer) => void) => {
        if (event === 'data') {
          dataHandler = handler;
          // Simulate arrow down, then Enter
          setTimeout(() => {
            if (dataHandler) {
              dataHandler(Buffer.from('\x1B[B')); // Arrow down
              setTimeout(() => {
                if (dataHandler) {
                  dataHandler(Buffer.from('\r')); // Enter
                }
              }, 10);
            }
          }, 10);
        }
      });

      const result = await prompt.prompt('Select option', options);
      expect(result).toEqual({ id: '2', label: 'Option 2' });
    });

    it('should filter options when typing', async () => {
      const prompt = new ChoicePrompt(true);
      const options = [
        { id: '1', label: 'Apple' },
        { id: '2', label: 'Banana' },
        { id: '3', label: 'Cherry' },
      ];

      let dataHandler: ((key: Buffer) => void) | null = null;
      mockStdin.on.mockImplementation((event: string, handler: (key: Buffer) => void) => {
        if (event === 'data') {
          dataHandler = handler;
          // Type 'a' to filter, then Enter
          setTimeout(() => {
            if (dataHandler) {
              dataHandler(Buffer.from('a')); // Type 'a' (should match Apple and Banana)
              setTimeout(() => {
                if (dataHandler) {
                  dataHandler(Buffer.from('\r')); // Enter
                }
              }, 10);
            }
          }, 10);
        }
      });

      const result = await prompt.prompt('Select fruit', options);
      // Should select first filtered option (Apple)
      expect(result).toEqual({ id: '1', label: 'Apple' });
    });
  });
});

describe('TextPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use inquirer for text input', async () => {
    const prompt = new TextPrompt();

    (inquirer.prompt as any).mockResolvedValueOnce({ value: 'test input' });

    const result = await prompt.prompt('Enter text');

    expect(inquirer.prompt).toHaveBeenCalledWith([
      expect.objectContaining({
        type: 'input',
        name: 'value',
        message: expect.any(String),
      }),
    ]);
    expect(result).toBe('test input');
  });

  it('should use default value when provided', async () => {
    const prompt = new TextPrompt();

    (inquirer.prompt as any).mockResolvedValueOnce({ value: 'default' });

    await prompt.prompt('Enter text', 'default');

    expect(inquirer.prompt).toHaveBeenCalledWith([
      expect.objectContaining({
        type: 'input',
        name: 'value',
        default: 'default',
      }),
    ]);
  });

  it('should handle empty input', async () => {
    const prompt = new TextPrompt();

    (inquirer.prompt as any).mockResolvedValueOnce({ value: '' });

    const result = await prompt.prompt('Enter text');

    expect(result).toBe('');
  });
});
