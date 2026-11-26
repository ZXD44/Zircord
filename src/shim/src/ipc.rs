use serde_json::{json, Value};
use std::fs::{File, OpenOptions};
use std::io::{Read, Write};

pub struct DiscordIpc {
    client_id: String,
    pipe: Option<File>,
}

impl DiscordIpc {
    pub fn new(client_id: String) -> Self {
        Self {
            client_id,
            pipe: None,
        }
    }

    pub fn is_connected(&self) -> bool {
        self.pipe.is_some()
    }

    pub fn connect(&mut self) -> bool {
        self.pipe = None;
        for i in 0..10 {
            let path = format!(r"\\.\pipe\discord-ipc-{}", i);
            if let Ok(file) = OpenOptions::new().read(true).write(true).open(&path) {
                self.pipe = Some(file);
                if self.handshake().is_ok() {
                    let _ = self.drain_frame();
                    return true;
                }
                self.pipe = None;
            }
        }
        false
    }

    fn write_frame(&mut self, opcode: i32, payload: &Value) -> std::io::Result<()> {
        let Some(ref mut f) = self.pipe else {
            return Err(std::io::Error::new(
                std::io::ErrorKind::NotConnected,
                "pipe closed",
            ));
        };
        let body = serde_json::to_vec(payload)?;
        let mut buf = Vec::with_capacity(8 + body.len());
        buf.extend_from_slice(&opcode.to_le_bytes());
        buf.extend_from_slice(&(body.len() as i32).to_le_bytes());
        buf.extend_from_slice(&body);
        if let Err(e) = f.write_all(&buf) {
            self.pipe = None;
            return Err(e);
        }
        let _ = f.flush();
        Ok(())
    }

    fn drain_frame(&mut self) -> std::io::Result<()> {
        let Some(ref mut f) = self.pipe else {
            return Ok(());
        };
        let mut header = [0u8; 8];
        f.read_exact(&mut header)?;
        let len = i32::from_le_bytes([header[4], header[5], header[6], header[7]]) as usize;
        if len > 0 && len < 65536 {
            let mut body = vec![0u8; len];
            f.read_exact(&mut body)?;
        }
        Ok(())
    }

    fn handshake(&mut self) -> std::io::Result<()> {
        let payload = json!({
            "v": 1,
            "client_id": self.client_id
        });
        self.write_frame(0, &payload)
    }

    pub fn set_activity(&mut self, activity: &Value, nonce: u64) -> bool {
        if self.pipe.is_none() && !self.connect() {
            return false;
        }
        let frame = json!({
            "cmd": "SET_ACTIVITY",
            "args": {
                "pid": std::process::id(),
                "activity": activity
            },
            "nonce": nonce.to_string()
        });
        if self.write_frame(1, &frame).is_err() {
            self.pipe = None;
            return false;
        }
        true
    }
}
