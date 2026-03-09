//! Integration tests for the local LLM module.
//!
//! These tests exercise the public API of `ai::local_llm` without a real
//! model on disk. The stub engine in `local_llm.rs` makes that possible.

use std::path::PathBuf;

use zipbrowser::ai::local_llm::{
    format_phi3_prompt, ChatMessage, InferenceRequest, LocalLlmEngine, Role,
    CHAT_SYSTEM_PROMPT, SUMMARIZE_SYSTEM_PROMPT, WRITING_SYSTEM_PROMPT,
};

// ---------------------------------------------------------------------------
// Prompt formatting
// ---------------------------------------------------------------------------

#[test]
fn phi3_system_prompt_is_set() {
    let prompt = format_phi3_prompt(CHAT_SYSTEM_PROMPT, &[], "Hello");
    assert!(
        prompt.starts_with("<|system|>"),
        "Phi-3 prompt must start with <|system|>"
    );
    assert!(
        prompt.contains(CHAT_SYSTEM_PROMPT),
        "System prompt content must appear in the formatted output"
    );
}

#[test]
fn phi3_user_turn_is_last() {
    let prompt = format_phi3_prompt(CHAT_SYSTEM_PROMPT, &[], "What is quantum?");
    assert!(
        prompt.contains("What is quantum?"),
        "User message must appear in prompt"
    );
    assert!(
        prompt.ends_with("<|assistant|>\n"),
        "Prompt must end with assistant turn marker"
    );
}

#[test]
fn phi3_history_preserved_in_order() {
    let history = vec![
        ChatMessage {
            role: Role::User,
            content: "First message".to_string(),
        },
        ChatMessage {
            role: Role::Assistant,
            content: "First reply".to_string(),
        },
        ChatMessage {
            role: Role::User,
            content: "Second message".to_string(),
        },
        ChatMessage {
            role: Role::Assistant,
            content: "Second reply".to_string(),
        },
    ];

    let prompt = format_phi3_prompt(CHAT_SYSTEM_PROMPT, &history, "Third message");

    let first_pos = prompt.find("First message").expect("First message must appear");
    let second_pos = prompt.find("Second message").expect("Second message must appear");
    let third_pos = prompt.find("Third message").expect("Third message must appear");

    assert!(
        first_pos < second_pos,
        "History messages must appear in document order"
    );
    assert!(
        second_pos < third_pos,
        "New user message must come after history"
    );
}

#[test]
fn summarize_system_prompt_present() {
    let prompt = format_phi3_prompt(
        SUMMARIZE_SYSTEM_PROMPT,
        &[],
        "Summarise this article: …",
    );
    assert!(prompt.contains("TL;DR"), "Summarize prompt must mention TL;DR");
}

#[test]
fn writing_system_prompt_present() {
    let prompt = format_phi3_prompt(WRITING_SYSTEM_PROMPT, &[], "Fix my text.");
    assert!(
        prompt.contains("writing assistant"),
        "Writing prompt must mention writing assistant"
    );
}

// ---------------------------------------------------------------------------
// Stub engine
// ---------------------------------------------------------------------------

#[tokio::test]
async fn stub_engine_loads_with_temp_file() {
    let tmp = tempfile::NamedTempFile::new().unwrap();
    let engine = LocalLlmEngine::load(tmp.path().to_path_buf())
        .await
        .expect("Stub engine should load from any existing path");

    assert_eq!(engine.model_path(), tmp.path());
}

#[tokio::test]
async fn stub_engine_rejects_missing_file() {
    let result =
        LocalLlmEngine::load(PathBuf::from("/nonexistent/path/model.gguf")).await;
    assert!(result.is_err(), "Engine should fail on missing model file");
}

#[tokio::test]
async fn stub_engine_generates_non_empty_response() {
    let tmp = tempfile::NamedTempFile::new().unwrap();
    let engine = LocalLlmEngine::load(tmp.path().to_path_buf())
        .await
        .unwrap();

    let result = engine
        .generate(
            InferenceRequest {
                prompt: "Hello, what is post-quantum cryptography?".to_string(),
                max_new_tokens: 64,
                temperature: 0.5,
                streaming: false,
            },
            None,
        )
        .await
        .unwrap();

    assert!(!result.text.is_empty(), "Generated text must not be empty");
    assert!(
        result.completion_tokens > 0,
        "Must report at least one completion token"
    );
}

#[tokio::test]
async fn stub_engine_streaming_sends_tokens() {
    use tokio::sync::mpsc;
    use zipbrowser::ai::local_llm::TokenEvent;

    let tmp = tempfile::NamedTempFile::new().unwrap();
    let engine = LocalLlmEngine::load(tmp.path().to_path_buf())
        .await
        .unwrap();

    let (tx, mut rx) = mpsc::channel::<TokenEvent>(64);

    let generate_handle = tokio::spawn(async move {
        engine
            .generate(
                InferenceRequest {
                    prompt: "Stream test".to_string(),
                    max_new_tokens: 16,
                    temperature: 0.7,
                    streaming: true,
                },
                Some(tx),
            )
            .await
            .unwrap()
    });

    let mut received = Vec::new();
    while let Some(event) = rx.recv().await {
        let done = event.done;
        received.push(event);
        if done {
            break;
        }
    }

    let _result = generate_handle.await.unwrap();

    assert!(
        !received.is_empty(),
        "At least one token event should be received"
    );

    let last = received.last().unwrap();
    assert!(last.done, "Last token event must have done=true");
}
