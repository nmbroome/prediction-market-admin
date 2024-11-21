use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use vercel_lambda::{lambda, IntoResponse, Request, Response};

#[derive(Debug, Serialize, Deserialize)]
struct ConstantProductMarketMaker {
    reserves: HashMap<String, f64>,
}

impl ConstantProductMarketMaker {
    fn new(token_a: &str, reserve_a: f64, token_b: &str, reserve_b: f64) -> Self {
        let mut reserves = HashMap::new();
        reserves.insert(token_a.to_string(), reserve_a);
        reserves.insert(token_b.to_string(), reserve_b);
        ConstantProductMarketMaker { reserves }
    }

    // Swap function: swap `amount_in` of `input_token` for `output_token`
    fn swap(&mut self, input_token: &str, output_token: &str, amount_in: f64) -> f64 {
        let reserve_in = self.get_reserve(input_token);
        let reserve_out = self.get_reserve(output_token);

        if reserve_in == 0.0 || reserve_out == 0.0 {
            panic!("Invalid reserves: one of the tokens has no liquidity.");
        }

        let amount_in_with_fee = amount_in * 0.997; // Applying a 0.3% fee
        let new_reserve_in = reserve_in + amount_in_with_fee;
        let new_reserve_out = reserve_in * reserve_out / new_reserve_in;

        let amount_out = reserve_out - new_reserve_out;

        // Update reserves after swap
        self.reserves.insert(input_token.to_string(), new_reserve_in);
        self.reserves.insert(output_token.to_string(), new_reserve_out);

        amount_out
    }

    // Function to get the current reserves
    fn get_reserve(&self, token: &str) -> f64 {
        *self.reserves.get(token).unwrap_or(&0.0)
    }
}

#[derive(Deserialize)]
struct SwapRequest {
    token_a: String,
    reserve_a: f64,
    token_b: String,
    reserve_b: f64,
    input_token: String,
    amount_in: f64,
}

fn handler(req: Request) -> impl IntoResponse {
    let swap_request: SwapRequest = match req.body() {
        Ok(body) => serde_json::from_slice(body).unwrap_or_else(|_| {
            return Response::builder()
                .status(400)
                .body("Invalid request body".into())
                .expect("Failed to render response");
        }),
        Err(_) => {
            return Response::builder()
                .status(400)
                .body("Invalid request".into())
                .expect("Failed to render response");
        }
    };

    let mut cpmm = ConstantProductMarketMaker::new(&swap_request.token_a, swap_request.reserve_a, &swap_request.token_b, swap_request.reserve_b);
    let output_token = if swap_request.input_token == swap_request.token_a {
        &swap_request.token_b
    } else {
        &swap_request.token_a
    };

    let amount_out = cpmm.swap(&swap_request.input_token, output_token, swap_request.amount_in);

    let response_body = serde_json::json!({
        "amount_out": amount_out,
        "reserves": cpmm.reserves
    });

    Response::builder()
        .status(200)
        .header("Content-Type", "application/json")
        .body(response_body.to_string().into())
        .expect("Failed to render response")
}

fn main() {
    lambda!(handler);
}
