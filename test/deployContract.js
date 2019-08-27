'use strict'

require('../config')

const fsPromise = require('fs').promises

const Web3 = require('web3')
const web3 = new Web3(process.env.PROVIDER)

const querystring = require('querystring')
const axios = require('axios')

const COMPILED_CONTRACTS_BASE_PATH = `${process.cwd()}/build/contracts`

const { deployContract } = require('../src/utils')

// used to remove `import 'xyz'` statements from Solidity src code
const IMPORT_SOLIDITY_REGEX = /^\s*import(\s+).*$/gm

async function main() {
    const nonce = await web3.eth.getTransactionCount(process.env.FUND_ACCOUNT_ETH_ADDRESS)
    await deployContract(nonce, web3)

    const srcFileNames = await fsPromise.readdir(COMPILED_CONTRACTS_BASE_PATH)

    const distinctPaths = new Set()

    const srcFilePaths = await Promise.all(
        srcFileNames.map(source => {
            const compilerOutput = require(`${COMPILED_CONTRACTS_BASE_PATH}/${source}`)
            compilerOutput.metadata = JSON.parse(compilerOutput.metadata)

            return Promise.all(
                Object.keys(compilerOutput.metadata.sources).map(async srcPath => {
                    try {
                        await fsPromise.stat(srcPath)
                        return srcPath
                    } catch (err) {
                        try {
                            await fsPromise.stat(`${process.cwd()}/node_modules/${srcPath}`)
                            return `${process.cwd()}/node_modules/${srcPath}`
                        } catch (err) {
                            console.log(`Couldn't find import '${srcPath}'.`)
                        }
                    }
                })
            )
        })
    )

    srcFilePaths.flat().forEach(path => distinctPaths.add(path))

    const promises = []

    distinctPaths.forEach(path => promises.push(fsPromise.readFile(path)))

    const concatenatedSourceCode = (await Promise.all(promises)).map(source => source.toString().replace(IMPORT_SOLIDITY_REGEX, '')).join('\n')

    const compilerMetadata = require(`${process.cwd()}/build/contracts/HoprChannel.json`).metadata

    let apiSubdomain = 'api'
    switch (process.env['NETWORK'].toLowerCase()) {
        case 'ropsten':
            apiSubdomain += '-ropsten'
            break
        case 'rinkeby':
            apiSubdomain += '-rinkeby'
            break
        default:
    }

    axios
        .post(
            `https://${apiSubdomain}.etherscan.io/api`,
            querystring.stringify({
                apikey: process.env['ETHERSCAN_API_KEY'],
                module: 'contract',
                action: 'verifysourcecode',
                contractaddress: process.env[`CONTRACT_ADDRESS`],
                sourceCode: concatenatedSourceCode,
                contractname: 'HoprChannel',
                compilerVersion: `v${compilerMetadata.compiler.version}`,
                constructorArguements: '',
                optimizationUsed: compilerMetadata.settings.optimizer.enabled ? '1' : '0',
                runs: compilerMetadata.settings.optimizer.runs.toString()
            })
        )
        .then(function(response) {
            console.log(response.statusText)
        })
        .catch(function(error) {
            console.log(error)
        })
}

main()
