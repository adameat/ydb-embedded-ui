const _ = require('lodash');
const path = require('path');

const srcRoot = path.resolve(__dirname, 'src');
const commonRoot = path.resolve(__dirname, 'node_modules/@yandex-data-ui/common');

module.exports = function override(config, env) {
    //do stuff with the webpack config...

    const oneOfRule = config.module.rules.find((r) => r.oneOf);
    oneOfRule.oneOf.splice(0, 0, {
        test: /\.svg$/,
        include: [path.resolve(srcRoot, 'assets/icons'), path.resolve(commonRoot, 'assets/icons')],
        loader: '@svgr/webpack',
        options: {dimensions: false},
    });
    if (env === 'production') {
        config.output.publicPath = 'resources/';
        config.output.path = path.resolve(__dirname, 'build/');
    }
    return config;
};
