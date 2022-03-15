module.exports = {
  moduleNameMapper: {
    'compiler-core/(.*?)$': '<rootDir>/packages/compiler-core/src/$1',
    'runtime-core/(.*?)$': '<rootDir>/packages/runtime-core/src/$1',
    'runtime-dom/(.*?)$': '<rootDir>/packages/runtime-dom/src/$1',
    'shared/(.*?)$': '<rootDir>/packages/shared/src/$1',
    'reactivity/(.*?)$': '<rootDir>/packages/reactivity/src/$1',
  },
}
