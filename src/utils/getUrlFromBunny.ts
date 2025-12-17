import config from '../config';
export const getBunnyUrl = async (fileKey: string) => {
     const url = `${config.bunnyCDN.pullZoneUrl}/${fileKey}`;
     return url;
};
