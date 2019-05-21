
const localConf = require('../localConf')


function currentProvider() {
    let name = localConf.get('cloudProvider')
    if ('aliyun' == name)
        return require('./aliyun');

    return null;
}


module.exports = {
    currentProvider,
}
