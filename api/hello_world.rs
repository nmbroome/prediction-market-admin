use serde_json::json;
use vercel_runtime::{run, Body, Error, Request, Response, StatusCode};
use http::header::HeaderValue;

/// Helper function to add CORS headers to a response.
fn build_response_with_cors(body: String, status: StatusCode) -> Result<Response<Body>, Error> {
    let mut response = Response::builder()
        .status(status)
        .header("Content-Type", "application/json");

    // Add CORS headers
    response = response
        .header("Access-Control-Allow-Origin", "*")
        .header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        .header("Access-Control-Allow-Headers", "Content-Type");

    // Build the final response
    response.body(body.into())
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    run(handler).await
}

pub async fn handler(_req: Request) -> Result<Response<Body>, Error> {
    let body = json!({
        "message": "Hello, World"
    })
    .to_string();

    // Use the helper function to build the response with CORS headers
    build_response_with_cors(body, StatusCode::OK)
}
