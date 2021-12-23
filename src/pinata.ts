import pinataSDK from "@pinata/sdk";
import { retrieveCollection } from "./fxhash";

require("dotenv").config();

const pinataApiKey = process.env.PINATA_API_KEY as string;
const pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY as string;

const pinata = pinataSDK(pinataApiKey, pinataSecretApiKey);

export const getIpfsHashFromUri = (uri: string) => uri.split("ipfs://")[1];

export const removeAllPin = async () => {
  const res = await pinata.pinList({
    status: "pinned",
    pageLimit: 500,
  });

  console.log(`${res.count} pin found`);

  for (let pin of res.rows) {
    await pinata
      .unpin(pin.ipfs_pin_hash)
      .catch((e) =>
        console.error(`Impossible to unpin ${pin.ipfs_pin_hash} : ${e}`)
      );
    console.log(`Unpinned '${pin.metadata.name}'.`);
  }

  console.log(`${res.count} unpinned.`);
};

export const pinCollection = async (collectionId: number) => {
  const tokens = await retrieveCollection(collectionId);

  for (const token of tokens) {
    await Promise.all([
      // Pin the artwork
      pinata.pinByHash(getIpfsHashFromUri(token.metadata.artifactUri), {
        pinataMetadata: {
          name: `Minted - ${token.metadata.name}`,
        },
      }),
      // Pin the metadata
      pinata.pinByHash(getIpfsHashFromUri(token.metadataUri), {
        pinataMetadata: {
          name: `Metas - ${token.metadata.name}`,
        },
      }),
    ]);
    console.log(`Pinned '${token.metadata.name}'.`);
  }

  console.log(`Pinned ${tokens.length} tokens.`);
};
