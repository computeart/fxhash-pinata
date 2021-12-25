import pinataSDK, { PinataClient, PinataPinListResponseRow } from "@pinata/sdk";
import { Dispatch, SetStateAction } from "react";
import fxhashService, { Token } from "./fxhash-service";

// const pinataApiKey = process.env.PINATA_API_KEY as string;
// const pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY as string;

// let pinata = pinataSDK(pinataApiKey, pinataSecretApiKey);

class PinataService {
  removeAllPin = async (
    pinataApiKey: string,
    pinataSecretApiKey: string,
    onPinRemoved?: (pin: PinataPinListResponseRow) => void
  ) => {
    const pinata = pinataSDK(pinataApiKey, pinataSecretApiKey);
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
      onPinRemoved?.(pin);
    }

    console.log(`${res.count} unpinned.`);
  };

  pinCollection = async (
    pinataApiKey: string,
    pinataSecretApiKey: string,
    collectionId: number,
    pinThumbnail: boolean = false,
    onTokenPinned?: (token: Token) => void
  ) => {
    const pinata = pinataSDK(pinataApiKey, pinataSecretApiKey);

    const tokens = await fxhashService.retrieveCollectionTokens(collectionId);

    for (const token of tokens) {
      const promises = [
        // Pin the artwork
        pinata.pinByHash(
          fxhashService.getIpfsHashFromUri(token.metadata.artifactUri),
          {
            pinataMetadata: {
              name: `Minted - ${token.metadata.name}`,
            },
          }
        ),
        // Pin the metadata
        pinata.pinByHash(fxhashService.getIpfsHashFromUri(token.metadataUri), {
          pinataMetadata: {
            name: `Metas - ${token.metadata.name}`,
          },
        }),
      ];

      if (pinThumbnail) {
        // Pin the thumbnail
        promises.push(
          pinata.pinByHash(
            fxhashService.getIpfsHashFromUri(token.metadata.thumbnailUri),
            {
              pinataMetadata: {
                name: `Thumbnail - ${token.metadata.name}`,
              },
            }
          )
        );
        // Pin the display
        promises.push(
          pinata.pinByHash(
            fxhashService.getIpfsHashFromUri(token.metadata.displayUri),
            {
              pinataMetadata: {
                name: `Display - ${token.metadata.name}`,
              },
            }
          )
        );
      }

      await Promise.all(promises);

      onTokenPinned?.(token);
      console.log(`Pinned '${token.metadata.name}'.`);
    }

    console.log(`Pinned ${tokens.length} tokens.`);
  };
}

export default new PinataService();
