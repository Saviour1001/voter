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

  let reply11Pda: anchor.web3.PublicKey;
  let reply11Info = null;

  let reply12Pda: anchor.web3.PublicKey;
  let reply12Info = null;

  let reply21Pda: anchor.web3.PublicKey;
  let reply21Info = null;

  it("Is initialized!", async () => {
    const [newPollCounterPDA, _] =
      await anchor.web3.PublicKey.findProgramAddressSync(
        [
          anchor.utils.bytes.utf8.encode("poll_counter"),
          program.provider.publicKey.toBuffer(),
        ],
        program.programId
      );

    pollCounterPDA = newPollCounterPDA

    const tx = await program.methods.initialize().accounts({
      admin: program.provider.publicKey,
      pollCounter: pollCounterPDA,
    })
    .rpc();

    pollCounterInfo = await program.account.pollCounter.fetch(pollCounterPDA);

    console.log(pollCounterInfo)

  });

  it("Creates first poll!", async () => {
      pollCounterInfo = await program.account.pollCounter.fetch(pollCounterPDA);

      console.log(pollCounterInfo)

    const [newPollQuestionPDA, _] =
      await anchor.web3.PublicKey.findProgramAddressSync(
        [
          anchor.utils.bytes.utf8.encode("poll_question"),
          toBytesInt64(pollCounterInfo.totalPolls),
        ],
        program.programId
      );

    pollQuestionPDA1 = newPollQuestionPDA

    console.log("pollQuestionPDA", pollQuestionPDA1.toBase58());

    const tx = await program.methods
      .createPoll("What is your favorite color?")
      .accounts({
        poll: pollQuestionPDA1,
        admin: program.provider.publicKey,
        pollCounter: pollCounterPDA
      })
      .rpc();

    pollQuestionInfo1 = await program.account.poll.fetch(pollQuestionPDA1);

    console.log([pollQuestionInfo1])
  });

    it("Creates second poll!", async () => {
      pollCounterInfo = await program.account.pollCounter.fetch(pollCounterPDA);

      console.log(pollCounterInfo)

    const [newPollQuestionPDA, _] =
      await anchor.web3.PublicKey.findProgramAddressSync(
        [
          anchor.utils.bytes.utf8.encode("poll_question"),
          toBytesInt64(pollCounterInfo.totalPolls),
        ],
        program.programId
      );

    pollQuestionPDA2 = newPollQuestionPDA

    console.log("pollQuestionPDA", pollQuestionPDA2.toBase58());

    const tx = await program.methods
      .createPoll("What is your favorite book?")
      .accounts({
        poll: pollQuestionPDA2,
        admin: program.provider.publicKey,
        pollCounter: pollCounterPDA
      })
      .rpc();

    pollQuestionInfo2 = await program.account.poll.fetch(pollQuestionPDA2);

    console.log([pollQuestionInfo2])
  });

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
