import pinataSDK, {
  PinataClient,
  PinataPinByHashResponse,
  PinataPinListResponse,
  PinataPinListResponseRow,
} from "@pinata/sdk";
import { Dispatch, SetStateAction } from "react";
import fxhashService, { Token } from "./fxhash-service";

// const pinataApiKey = process.env.PINATA_API_KEY as string;
// const pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY as string;

// let pinata = pinataSDK(pinataApiKey, pinataSecretApiKey);

type PinCollectionOpts = {
  avoidDuplicates?: boolean;
  pinThumbnail?: boolean;
  onTokenPinned?: (token: Token) => void;
};
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
    opts?: PinCollectionOpts
    // pinThumbnail: boolean = false,
    // onTokenPinned?: (token: Token) => void
  ) => {
    opts ??= {};
    const pinThumbnail = opts.pinThumbnail || false;
    const avoidDuplicates = opts.avoidDuplicates || true;
    const pinata = pinataSDK(pinataApiKey, pinataSecretApiKey);

    const tokens = await fxhashService.retrieveCollectionTokens(collectionId);

    // Retrieve the current pinned assets if needed
    let alreadyPinnedListHash: string[] = [];
    if (avoidDuplicates) {
      let pinList: PinataPinListResponseRow[] = [];
      let response: PinataPinListResponse;
      let pageOffset = 0;
      const pageLimit = 1000;

      do {
        response = await pinata.pinList({
          status: "pinned",
          pageLimit,
          pageOffset,
        });
        pinList = [...pinList, ...response.rows];
        pageOffset += response.count;
      } while (response.count == pageLimit);

      alreadyPinnedListHash = pinList.map((pin) => pin.ipfs_pin_hash);
      console.log(alreadyPinnedListHash[0]);
    }

    const pinataPin = (
      uri: string,
      name: string
    ): Promise<PinataPinByHashResponse> | undefined => {
      const hash = fxhashService.getIpfsHashFromUri(uri);
      if (!alreadyPinnedListHash.includes(hash)) {
        return pinata.pinByHash(hash, {
          pinataMetadata: {
            name: name,
          },
        });
      }
    };

    for (const token of tokens) {
      const promises = [
        // Pin the artwork
        pinataPin(
          token.metadata.artifactUri,
          `Minted - ${token.metadata.name}`
        ),
        // Pin the metadata
        pinataPin(token.metadataUri, `Metas - ${token.metadata.name}`),
      ];

      if (pinThumbnail) {
        // Pin the thumbnail
        promises.push(
          pinataPin(
            token.metadata.thumbnailUri,
            `Thumbnail - ${token.metadata.name}`
          )
        );
        // Pin the display
        promises.push(
          pinataPin(
            token.metadata.displayUri,
            `Display - ${token.metadata.name}`
          )
        );
      }

      await Promise.all(promises);

      opts.onTokenPinned?.(token);
      console.log(`Pinned '${token.metadata.name}'.`);
    }

    console.log(`Pinned ${tokens.length} tokens.`);
  };
}

export default new PinataService();
