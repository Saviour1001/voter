import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { GriffyVoter } from "../target/types/griffy_voter";
import { expect } from "chai";

const toBytesInt64 = (num: bigint): Buffer => {
  const arr = new ArrayBuffer(8);
  const view = new DataView(arr);
  view.setBigUint64(0, num);
  return Buffer.from(arr);
};

describe("griffy-voter", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.GriffyVoter as Program<GriffyVoter>;

  let adminKey: anchor.web3.Keypair;

  before(async () => {
    await getAdminKey();
  });

  async function getAdminKey() {
    adminKey = await generateFundedKeypair();
  }

  let pollCounterPDA: anchor.web3.PublicKey;
  let pollCounterInfo = null;

  let pollQuestionPDA1: anchor.web3.PublicKey;
  let pollQuestionInfo1 = null;

  let pollQuestionPDA2: anchor.web3.PublicKey;
  let pollQuestionInfo2 = null;

  let vote11Pda: anchor.web3.PublicKey;
  let vote11Info = null;

  let vote12Pda: anchor.web3.PublicKey;
  let vote12Info = null;

  it("Is initialized!", async () => {
    const [newPollCounterPDA, _] =
      await anchor.web3.PublicKey.findProgramAddressSync(
        [
          anchor.utils.bytes.utf8.encode("poll_counter"),
          program.provider.publicKey.toBuffer(),
        ],
        program.programId
      );

    pollCounterPDA = newPollCounterPDA;

    const tx = await program.methods
      .initialize()
      .accounts({
        admin: program.provider.publicKey,
        pollCounter: pollCounterPDA,
      })
      .rpc();

    pollCounterInfo = await program.account.pollCounter.fetch(pollCounterPDA);
  });

  it("Creates first poll!", async () => {
    pollCounterInfo = await program.account.pollCounter.fetch(pollCounterPDA);

    const [newPollQuestionPDA, _] =
      await anchor.web3.PublicKey.findProgramAddressSync(
        [
          anchor.utils.bytes.utf8.encode("poll_question"),
          toBytesInt64(pollCounterInfo.totalPolls),
        ],
        program.programId
      );

    pollQuestionPDA1 = newPollQuestionPDA;

    console.log("pollQuestionPDA1", pollQuestionPDA1.toBase58());

    const tx = await program.methods
      .createPoll("What is your favorite color?")
      .accounts({
        poll: pollQuestionPDA1,
        admin: program.provider.publicKey,
        pollCounter: pollCounterPDA,
      })
      .rpc();

    pollQuestionInfo1 = await program.account.poll.fetch(pollQuestionPDA1);
    console.log("pollQuestionInfo1", pollQuestionInfo1);
  });

  it("First vote on first poll!", async () => {
    const [newVotePDA, _] = await anchor.web3.PublicKey.findProgramAddressSync(
      [
        anchor.utils.bytes.utf8.encode("vote"),
        toBytesInt64(pollQuestionInfo1.pollId),
        toBytesInt64(pollQuestionInfo1.totalVotes),
      ],
      program.programId
    );

    vote11Pda = newVotePDA;

    console.log("vote11Pda", vote11Pda.toBase58());

    const tx = await program.methods
      .castVote("timelock-vote-string", new anchor.BN(322))
      .accounts({
        poll: pollQuestionPDA1,
        vote: vote11Pda,
        voter: program.provider.publicKey,
      })
      .rpc();

    vote11Info = await program.account.vote.fetch(vote11Pda);

    console.log([vote11Info]);
  });

  it("Second vote on first poll!", async () => {
    const [newVotePDA, _] = await anchor.web3.PublicKey.findProgramAddressSync(
      [
        anchor.utils.bytes.utf8.encode("vote"),
        toBytesInt64(pollQuestionInfo1.pollId),
        toBytesInt64(pollQuestionInfo1.totalVotes),
      ],
      program.programId
    );

    vote12Pda = newVotePDA;

    console.log("vote12Pda", vote12Pda.toBase58());

    const tx = await program.methods
      .castVote("timelock-vote-string-vote2", new anchor.BN(322))
      .accounts({
        poll: pollQuestionPDA1,
        vote: vote12Pda,
        voter: program.provider.publicKey,
      })
      .rpc();

    vote12Info = await program.account.vote.fetch(vote12Pda);

    console.log([vote12Info]);
  });

  // it("Creates second poll!", async () => {
  //   pollCounterInfo = await program.account.pollCounter.fetch(pollCounterPDA);

  //   console.log("pollCounterInfo", pollCounterInfo.totalPolls);

  //   const [newPollQuestionPDA, _] =
  //     await anchor.web3.PublicKey.findProgramAddressSync(
  //       [
  //         anchor.utils.bytes.utf8.encode("poll_question"),
  //         toBytesInt64(pollCounterInfo.totalPolls),
  //       ],
  //       program.programId
  //     );

  //   pollQuestionPDA2 = newPollQuestionPDA;

  //   console.log("pollQuestionPDA", pollQuestionPDA2.toBase58());

  //   const tx = await program.methods
  //     .createPoll("What is your favorite book?")
  //     .accounts({
  //       poll: pollQuestionPDA2,
  //       admin: program.provider.publicKey,
  //       pollCounter: pollCounterPDA,
  //     })
  //     .rpc();

  //   pollQuestionInfo2 = await program.account.poll.fetch(pollQuestionPDA2);

  //   console.log([pollQuestionInfo2]);
  // });

  async function generateFundedKeypair(): Promise<anchor.web3.Keypair> {
    const newKeypair = anchor.web3.Keypair.generate();

    const transaction = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.transfer({
        fromPubkey: program.provider.publicKey,
        toPubkey: newKeypair.publicKey,
        lamports: 5 * anchor.web3.LAMPORTS_PER_SOL,
      })
    );
    const _confirmation = await (
      program.provider as anchor.AnchorProvider
    ).sendAndConfirm(transaction);

    return newKeypair;
  }
});
