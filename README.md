# @thlion/tstl-dota-debug-fix

A small TypeScriptToLua plugin for Dota 2 mod projects that injects the generated Lua file path into Lua classes.

This package adds file metadata to Lua classes for use in modifier registration. It does not replace previous approaches directly, but provides a reliable alternative required due to the removal of the `debug` library from the Dota 2 Lua runtime. The file path is exposed through the transformed Lua class as `____file_path`.

## What it does

When TypeScriptToLua compiles your code, this package adds a file path field to generated Lua classes. In your runtime code, you can read that field from the modifier class and use it for registration or debugging logic.

## Installation

Add the package and its required dependencies to your project:

```json
{
  "devDependencies": {
    "@moddota/dota-lua-types": "...",
    "@thlion/tstl-dota-debug-fix": "1.0.0",
    "typescript": "...",
    "typescript-to-lua": "..."
  }
}
```

Then install dependencies:

```bash
npm install
```

## Configuration

Add the plugin to your TypeScriptToLua configuration.

`src/vscripts/tsconfig.json`:

```json
{
  "tstl": {
    "luaTarget": "JIT",
    // important! don't forget to disable traceback because it uses debug!
    "sourceMapTraceback": false,
    "luaPlugins": [
      { "name": "@thlion/tstl-dota-debug-fix/transformer" }
    ]
  }
}
```

## Usage

Update your modifier registration code to read the generated file path from the class metadata.

`src/vscripts/lib/dota_ts_adapter.ts`:

```ts
export const registerModifier = (name?: string) => (modifier: new () => CDOTA_Modifier_Lua, context: ClassDecoratorContext) => {
  // ...

  // no longer works
  // const [fileName] = string.gsub(source, ".*scripts[\\/]vscripts[\\/], "");

  // the `____file_path` parameter is specified via the Lua's transformer
  const fileName = (modifier as any).____file_path as string | undefined;
  if (!fileName) {
      throw "Unable to determine file path of this modifier class!";
  }

  // ...
}
```

Please note that because the debug library is missing, the `getFileScope` function no longer works. You can replace it with a simple solution:

```ts
function getFileScope(): [any, string] {
    return [getfenv(3), "unknown"];
}
```

## Notes

* `sourceMapTraceback` should be disabled because the debug library (used for traceback output) is not available in the Dota 2 Lua runtime.
* You can see that in the `getFileScope` function, we use the third environment level. This is because the third level allows us to register everything we need (abilities, modifiers, items, and entity functions).
* The plugin is meant to be used with TypeScriptToLua-based Dota 2 projects.
* The generated property name is `____file_path`.
