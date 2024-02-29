// function processMixinsSelfInclude(mixins: MIXINS[]) {

//   const nestedMixins: Set<string> = new Set();

//   const includeNameRegex = new RegExp(/(@include[ a-zA-Z0-9-]+)/, '');
//   const getMixinProperties = (data: string, name: string) => data.split(`${name}(`)[1].split(')')[0].split(',').map(s => s.trim()).filter(s => s.length !== 0);
//   for (const mixin of mixins) {

//     while (mixin.content.includes('@include')) {
//       nestedMixins.add(mixin.name);
//       const mixinName = mixin.content.match(includeNameRegex)[0].substring(9);

//       const startIndex = mixin.content.indexOf('@include ' + mixinName);
//       const endIndex = mixin.content.indexOf(')', startIndex);
//       const includeHeader = mixin.content.slice(startIndex, endIndex + 2);

//       const mixinToBeIncluded = mixins.find(mixin => mixin.name === mixinName)
//       let mixinContent = mixinToBeIncluded.content;
//       if (mixinToBeIncluded.properties.length !== 0) {
//         const includeProperties = getMixinProperties(mixin.content, mixinName);
//         for (let i = 0; i < includeProperties.length; i++) {
//           mixinContent = mixinContent.replaceAll(mixinToBeIncluded.properties[i], includeProperties[i]);
//         }
//       }

//       mixin.content = mixin.content.replace(includeHeader, mixinContent + ' ');

//     }
//   }
//   return { nestedMixins, mixins };
// }

// function processScss(processedMixin: { nestedMixins: Set<string>, mixins: MIXINS[] }, data: string) {
//   const { nestedMixins, mixins } = processedMixin;
//   const getMixinProperties = (data: string) => data.split('(')[1].split(')')[0].split(',').map(s => s.trim()).filter(s => s.length !== 0);

//   mixins.forEach((mixin: MIXINS) => nestedMixins.add(mixin.name))

//   nestedMixins.forEach((mixinName: string) => {
//     while (data.includes('@include ' + mixinName)) {

//       // @include metaData
//       const startIndex = data.indexOf('@include ' + mixinName);
//       const endIndex = data.indexOf(')', startIndex);
//       const includeHeader = data.slice(startIndex, endIndex + 2);
//       const includeProperties = getMixinProperties(includeHeader);

//       // Mixin Data
//       let { content, properties } = mixins.find(mixin => mixin.name === mixinName);
//       properties.forEach((prop: string, index: number) => {
//         content = content.replaceAll(prop, includeProperties[index]);
//       });
//       data = data.replace(includeHeader, content);
//     }
//   });

//   return data;
// }

// function extractAndProcessMixins(data: string) {
//   const mixins: any[] = [];
//   // This will match the whole mixin except the last closing bracket } which we will consider to be the last one.
//   const mixinsRegex = new RegExp(/(@mixin)([\s\S]*?)(^})/, 'gm');
//   const mixinNameRegex = new RegExp(/(@mixin[ a-zA-Z0-9-]+)/, 'g');
//   const mixinContentRegex = new RegExp(/(?<={)[\s\S]*(?=})/, 'g');
//   const getMixinProperties = (data: string) => data.split('(')[1].split(')')[0].split(',').map(s => s.trim()).filter(s => s.length !== 0);

//   for (const mixin of (data.match(mixinsRegex) || [])) {
//     if (mixin && mixin.match(mixinNameRegex)) {
//       const name = mixin.match(mixinNameRegex)[0].substring(7).trim();
//       const content = mixin.match(mixinContentRegex)[0];
//       const properties = mixin.includes(name + '(') ? getMixinProperties(mixin) : [];

//       // DO NOT add unused mixins
//       if (data.includes('@include ' + name) === false) { continue; }

//       mixins.push({ name, content, properties });
//     }
//   }

//   const processedMixin: { nestedMixins: Set<string>, mixins: MIXINS[] } = processMixinsSelfInclude(mixins);

//   const mixinData = removeMixins(data)

//   const scss = processScss(processedMixin, mixinData);

//   return scss;
// }

