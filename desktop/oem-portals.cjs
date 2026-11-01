const portals = new Map([
 ['gm','https://www.acdelcotds.com/subscriptions'],
 ['ford','https://www.motorcraftservice.com/Diagnostic/HelmSupport?categoryId=238&channelId=41&country=USA&language=EN-US'],
 ['stellantis','https://kb.fcawitech.com/article/325/vehicle-reprogramming-subscription-40%3Bvrs-41%3B-how-to-965.html'],
 ['mitsubishi','https://www.mitsubishitechinfo.com/epacarb/specialtools.jsp'],
]);
function resolvePortal(id) {
 if(typeof id!=='string'||!portals.has(id))throw Error('Unknown OEM portal.');
 return portals.get(id);
}
module.exports={resolvePortal};
