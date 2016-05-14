JavaScript Shift AST Specification Representation
=================================================


## About

This package provides a JavaScript representation of the [Shift spec](http://shift-ast.org/).

It is primarily intended for use by other Shift tools.


## Usage

```js
import Spec from "shift-spec";
for (let typeName in Spec) {
  let type = Spec[typeName];
  let fields = type.fields.filter(f => f.name !== 'type');
  console.log(typeName, fields);
}
```


## License

    Copyright 2016 Shape Security, Inc.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
