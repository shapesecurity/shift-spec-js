/**
 * Copyright 2016 Shape Security, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const distDir = __dirname + '/../dist/';

const fs = require('fs');

const specConsumer = require('shift-spec-consumer');
const { nodes, enums, namedTypes } = specConsumer(fs.readFileSync(require.resolve('shift-spec-idl/spec.idl'), 'utf8'), fs.readFileSync(require.resolve('shift-spec-idl/attribute-order.conf'), 'utf8'));

const TYPE_INDICATOR_ENUM_NAME = 'TYPE_INDICATOR';

function height(name) {
  const type = nodes.get(name);
  if (type.children.length === 0) return 0;
  return 1 + Math.max(...type.children.map(height));
}

function nameType(type) {
  switch (type.kind) {
    case 'type':
      return `Const(TYPE_INDICATOR), value: "${type.argument}"`;
    case 'nullable':
      return `Maybe(${nameType(type.argument)})`;
    case 'union':
      return `Union(${type.argument.map(nameType).sort().join(', ')})`;
    case 'list':
      return `List(${nameType(type.argument)})`;
    case 'value':
      switch (type.argument) {
        case 'string':
          return 'STRING';
        case 'double':
          return 'DOUBLE';
        case 'boolean':
          return 'BOOLEAN';
        default:
          throw 'Not reached';
      }
    case 'node':
    case 'enum':
      return type.argument;
    case 'namedType':
      return nameType(namedTypes.get(type.argument));
    default:
      throw 'Not reached';
  }
}

let content = `// Generated by src/generate-spec.js. 

/**
 * Copyright 2016 Shape Security, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


module.exports = (function() {
  var SPEC = {};

  var BOOLEAN = { typeName: "Boolean" };
  var DOUBLE = { typeName: "Number" };
  var STRING = { typeName: "String" };
  function Maybe(arg) { return { typeName: "Maybe", argument: arg }; }
  function List(arg) { return { typeName: "List", argument: arg }; }
  function Const(arg) { return { typeName: "Const", argument: arg }; }
  function Union() { return { typeName: "Union", arguments: [].slice.call(arguments, 0) }; }

`;

const allNames = Array.from(nodes.keys()).sort();
const innerNames = allNames.filter(n => nodes.get(n).children.length !== 0);
const leafNames = allNames.filter(n => nodes.get(n).children.length === 0);

content += `
  var ${TYPE_INDICATOR_ENUM_NAME} = {
    typeName: "Enum",
    values: [${leafNames.map(x => `"${x}"`).join(', ')}]
  };
`;

for (let en of Array.from(enums.keys()).sort()) {
  content += `
  var ${en} = {
    typeName: "Enum",
    values: [${enums.get(en).map(x => `"${x}"`).join(', ')}]
  }
  `;
}

content += '\n';

for (let name of leafNames) {
  content += `
  var ${name} = SPEC.${name} = {};`;
}

content += '\n';

for (let name of [...innerNames].sort((a, b) => height(a) - height(b))) {
  content += `
  var ${name} = Union(${nodes.get(name).children.sort().join(', ')});`;
}

content += '\n';

for (let name of leafNames) {
  content += `
  ${name}.typeName = "${name}";
  ${name}.fields = [`;
  const attrs = [{ name: 'type', type: { kind: 'type', argument: name } }].concat(nodes.get(name).attributes);
  content += attrs.map(attr => `\n    { name: "${attr.name}", type: ${nameType(attr.type)} }`).join(',');
  content += '\n  ];\n';
}

content += `
  return SPEC;
}());
`;

try {
  fs.mkdirSync(distDir);
} catch (ignored) {}
fs.writeFileSync(distDir + 'index.js', content, 'utf-8');
