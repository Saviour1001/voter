use anchor_lang::prelude::*;

declare_id!("3qhJ4sBqUXCHT4AjDmgZRgb74ipymQuC159mq1KDRvzp");

#[program]
pub mod griffy_voter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
