Getting Started - Vercel Functions with Rust runtime

Prerequisites:
Install the vercel CLI - https://vercel.com/docs/cli#installing-vercel-cli
Set up the Rust toolchain - rustup https://rustup.rs/

Step 1: Add a vercel.json file to the root directory of the project

Step 2: Create an API directory and create a function inside a rust file

Step 3: Add a Cargo.toml file to the root directory of the project

Step 4: Create a .vercelignore file in the root directory to ignore build artifacts

Step 5: use vercel dev to develop locally and vercel --prod to deploy to production

Deployment:
Need to include this buildCommand in vercel.json
"buildCommand": "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && source $HOME/.cargo/env && npm run build"
Also update build in package.json to 
"build": "cargo build --release && next build"

Add additional functions in the api directory and make sure to update vercel.json and Cargo.toml to find the files.

Calling Functions:
Use the endpoint /api/filename
Call in an async block as a REST API