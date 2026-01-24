use napi_derive::napi;
use std::process::{Command, Stdio};
use tokio::process::Command as TokioCommand;

#[napi]
pub async fn run_task(command: String) -> napi::Result<bool> {
    let status = TokioCommand::new("sh")
        .arg("-c")
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
pub fn run_task_sync(command: String) -> napi::Result<bool> {
    let status = Command::new("sh")
        .arg("-c")
        .arg(&command)
        .stdin(Stdio::inherit())
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .status()
        .map_err(|e| napi::Error::from_reason(format!("Failed to execute command: {}", e)))?;

    Ok(status.success())
}

