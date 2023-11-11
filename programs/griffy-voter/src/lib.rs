use anchor_lang::prelude::*;

declare_id!("3qhJ4sBqUXCHT4AjDmgZRgb74ipymQuC159mq1KDRvzp");

#[program]
pub mod griffy_voter {
    use super::*;

    pub fn initialize(ctx: Context<InitializePolls>) -> Result<()> {
        let poll_counter = &mut ctx.accounts.poll_counter;
        poll_counter.admin = *ctx.accounts.admin.key;
        poll_counter.total_polls = 0;
        Ok(())
    }

    pub fn create_poll(ctx: Context<CreatePoll>, poll_question: String) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        poll.poll_question = poll_question;
        poll.total_votes = 0;
        poll.poll_id = ctx.accounts.poll_counter.total_polls;

        let poll_counter = &mut ctx.accounts.poll_counter;
        poll_counter.increment();

        Ok(())
    }

    pub fn cast_vote(ctx: Context<CastVote>, timelock_encrypted_vote: String) -> Result<()> {
        let vote = &mut ctx.accounts.vote;
        vote.timelock_encrypted_vote = timelock_encrypted_vote;
        vote.vote_id = ctx.accounts.poll.total_votes;

        let poll = &mut ctx.accounts.poll;
        poll.total_votes += 1;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializePolls<'info> {
    #[account(
        init,
        payer = admin,
        space = PollCounter::size(),
        seeds = ["poll_counter".as_bytes(), admin.key().as_ref()],
        bump
    )]
    pub poll_counter: Account<'info, PollCounter>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreatePoll<'info> {
    #[account(
        init,
        payer = admin,
        space = Poll::size(),
        seeds = [b"poll_question", poll_counter.total_polls.to_le_bytes().as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(mut)]
    pub poll_counter: Account<'info, PollCounter>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(
        init,
        payer = voter,
        space = Vote::size(),
        seeds = [
            "vote".as_bytes(),
            poll.poll_id.to_le_bytes().as_ref(),
            poll.total_votes.to_le_bytes().as_ref(),
        ],
        bump
    )]
    pub vote: Account<'info, Vote>,
    #[account(mut)]
    pub voter: Signer<'info>,
    #[account(mut)]
    pub poll: Account<'info, Poll>,
    pub system_program: Program<'info, System>,
}

const DISCRIMINATOR_LENGTH: usize = 8;
const PUBLIC_KEY_LENGTH: usize = 32;
const VECTOR_LENGTH: usize = 4;
const STRING_LENGTH_PREFIX: usize = 4;
const MAX_POLL_LENGTH: usize = 280 * 4; // 280 chars max.
const MAX_VOTE_LENGTH: usize = 280 * 4; // 280 chars max.
const U_64_LENGTH: usize = 8;

#[account]
#[derive(Default)]
pub struct PollCounter {
    pub admin: Pubkey, // admin's address
    pub total_polls: u64, // total polls
    pub bump: u8, // bump seed
}

#[account]
pub struct Poll {
    pub poll_question: String, // poll question
    pub poll_id: u64, // poll id
    pub total_votes: u64, // total votes
    pub bump: u8, // bump seed
}

#[account]
pub struct Vote {
    pub voter: Pubkey, // voter's address
    pub vote_id: u64, // vote id
    pub timelock_encrypted_vote: String, // timelock encrypted vote
    pub amount: u64, // stake amount
    pub bump: u8, // bump seed
}

impl PollCounter {
    pub fn size() -> usize {
        DISCRIMINATOR_LENGTH + // discriminator
            PUBLIC_KEY_LENGTH + // admin
            U_64_LENGTH + // total polls
            1 // bump
    }

    pub fn new(admin: Pubkey, bump: u8) -> Self {
        Self {
            admin,
            bump,
            ..Default::default()
        }
    }

    pub fn increment(&mut self) {
        self.total_polls += 1;
    }
}

impl Poll {
    pub fn size() -> usize {
        DISCRIMINATOR_LENGTH + // discriminator
            (STRING_LENGTH_PREFIX + MAX_POLL_LENGTH) + // poll question
            U_64_LENGTH + // total votes
            1 // bump
    }

    pub fn new(poll_question: String, total_votes: u64, poll_id: u64, bump: u8) -> Self {
        Self {
            poll_question,
            poll_id,
            total_votes,
            bump,
        }
    }
}

impl Vote {
    pub fn size() -> usize {
        DISCRIMINATOR_LENGTH + // discriminator
            PUBLIC_KEY_LENGTH + // voter
            (STRING_LENGTH_PREFIX + MAX_VOTE_LENGTH) + // vote
            U_64_LENGTH + // amount
            1 // bump
    }

    pub fn new(
        voter: Pubkey,
        timelock_encrypted_vote: String,
        vote_id: u64,
        amount: u64,
        bump: u8
    ) -> Self {
        Self {
            voter,
            vote_id,
            timelock_encrypted_vote,
            amount,
            bump,
        }
    }
}
