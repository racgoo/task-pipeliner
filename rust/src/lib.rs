use napi_derive::napi;
use std::process::{Command, Stdio};
use tokio::process::Command as TokioCommand;

/// Get default shell for the current platform
/// Uses the user's current shell (from $SHELL or %COMSPEC%) to match their environment
fn get_default_shell() -> Vec<String> {
    #[cfg(target_os = "windows")]
    {
        vec![
            std::env::var("COMSPEC").unwrap_or_else(|_| "cmd.exe".to_string()),
            "/c".to_string(),
        ]
    }

    #[cfg(not(target_os = "windows"))]
    {
        // Use user's current shell (e.g., zsh, bash) instead of hardcoded sh
        let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/sh".to_string());
        vec![shell, "-c".to_string()]
    }
}

/// Parse shell config: first element is program, rest are args
fn parse_shell_config(shell: Option<Vec<String>>) -> (String, Vec<String>) {
    let config = shell.unwrap_or_else(get_default_shell);
    
    if config.is_empty() {
        let default = get_default_shell();
        (default[0].clone(), default[1..].to_vec())
    } else {
        (config[0].clone(), config[1..].to_vec())
    }
}

#[napi]
pub async fn run_task(command: String, shell: Option<Vec<String>>) -> napi::Result<bool> {
    let (program, args) = parse_shell_config(shell);
    
    let status = TokioCommand::new(&program)
        .args(&args)
        .arg(&command)
        .stdin(Stdio::inherit())
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .status()
        .await
        .map_err(|e| napi::Error::from_reason(format!("Failed to execute command: {}", e)))?;

    Ok(status.success())
}

#[napi]
pub fn run_task_sync(command: String, shell: Option<Vec<String>>) -> napi::Result<bool> {
    let (program, args) = parse_shell_config(shell);
    
    let status = Command::new(&program)
        .args(&args)
        .arg(&command)
        .stdin(Stdio::inherit())
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .status()
        .map_err(|e| napi::Error::from_reason(format!("Failed to execute command: {}", e)))?;

    Ok(status.success())
}

