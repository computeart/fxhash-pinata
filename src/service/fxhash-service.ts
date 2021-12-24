import axios from "axios";

export interface Token {
  metadata: {
    name: string;
    iterationHash: string;
    description: string;
    tags: string[];
    artifactUri: string; // The artwork uri ipfs://QmSEDSvXVTHXb2gB37FBEbf7NBTNk8TcVueQTihgkCkY6Y
    displayUri: string; // ipfs://Qmawubu5FV7pGWUSJ2k6NdqQPiAFf1GU47YDnoLZGtkyN7
    thumbnailUri: string; // ipfs://QmYioG3qAooF2ujcFwpoRZMiowsFGcnQJnfPPKL9L4B9Dc
    authenticityHash: string;
    attributes: Object[];
  };
  metadataUri: string;
}

export interface Collection {
  name: string;
  supply: number;
  objktsCount: number;
}

const FETCH_STEP = 50;

class FxhashService {
  getCollection = async (collectionId: number): Promise<Collection> => {
    const response = await axios.post(process.env.FXHASH_API_URL as string, {
      query: `{
        generativeToken(id: ${collectionId}) {
          objktsCount
          supply
          name
        }
      }`,
    });

    return response.data.data.generativeToken;
  };

  retrieveCollectionTokens = async (collectionId: number): Promise<Token[]> => {
    let tokens: Token[] = [];

    console.log(`Fetch tokens for collection ${collectionId}...`);

    const fetchObjkts = async (skipCounter = 0) => {
      const response = await axios.post(process.env.FXHASH_API_URL as string, {
        query: `{
        generativeToken(id: ${collectionId}) {
          objkts(skip:${skipCounter} take: ${FETCH_STEP}) {
            metadata
            metadataUri
          }
        }
      }`,
      });
      const objkts = response.data.data.generativeToken.objkts;

      // If there is still objkts to fetch
      if (objkts.length > 0) {
        tokens = [...tokens, ...objkts];
        console.log(
          `Retrieved tokens ${skipCounter} to ${skipCounter + objkts.length}...`
        );
        await fetchObjkts(skipCounter + FETCH_STEP);
      }
    };

    await fetchObjkts();

    return tokens;
  };

  getIpfsHashFromUri = (uri: string) => uri.split("ipfs://")[1];
}

export default new FxhashService();
