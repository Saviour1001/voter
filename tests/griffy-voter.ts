import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { GriffyVoter } from "../target/types/griffy_voter";
import { expect } from "chai";

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

  it("Is initialized!", async () => {
    const [pollCounterPDA, _] =
      await anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from(anchor.utils.bytes.utf8.encode("poll_counter")),
          program.provider.publicKey.toBuffer(),
        ],
        program.programId
      );

    const tx = await program.methods.initialize().accounts({
      admin: adminKey.publicKey,
      pollCounter: pollCounterPDA,
    });
  });

  it("Creates a poll!", async () => {
    const [pollQuestionPDA, _] =
      await anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from(anchor.utils.bytes.utf8.encode("poll_question"))],
        program.programId
      );

    console.log("pollQuestionPDA", pollQuestionPDA.toBase58());

    const tx = await program.methods
      .createPoll("What is your favorite color?")
      .accounts({
        admin: adminKey.publicKey,
        poll: pollQuestionPDA,
      })
      .signers([adminKey])
      .rpc();
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
