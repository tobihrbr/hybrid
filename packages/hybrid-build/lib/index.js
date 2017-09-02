// Builtin
const { join, basename } = require('path');

// Packages
const rollup = require('rollup');
const nodeResolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const babel = require('rollup-plugin-babel');
const hashicle = require('hashicle-from-file');

module.exports = (entry, outPath) =>
  new Promise(async (resolve, reject) => {
    const stats = {};

    let hash = await hashicle(entry);

    const input = {
      input: entry,
      plugins: [
        nodeResolve(),
        commonjs({
          include: '*'
        }),
        babel({
          exclude: 'node_modules/**',
          babelrc: false,
          filename: join(outPath, 'hybrid-transpile-' + hash + '.js'),
          presets: [['env', { modules: false }]]
        })
      ],
      onwarn(warning) {
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
        /* istanbul ignore next */
        if (warning.code === 'NON_EXISTENT_EXPORT') reject(warning.message);

        stats.warning = warning;
      }
    };

    const bundle = await rollup.rollup(input);

    await bundle.write({
      format: 'cjs',
      name: 'hybrid-bundle-' + hash,
      file: join(outPath, 'hybrid-' + hash + '.js'),
      sourcemap: true,
      banner: `/* This file was automatically generated by hybrid
* Please don\'t modify it! */\n
/* Debug-names: hybrid-transpile-${hash}.js and hybrid-bundle-${hash} */\n
/* Matching function: ${basename(entry)} */`,
      footer: 'if (module.export !== undefined) { module.exports = module.export }\n /* === Hybrid End === */'
    });

    stats.dest = join(outPath, 'hybrid-' + hash + '.js');

    resolve(stats);
  });
