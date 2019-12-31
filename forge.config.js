module.exports = {
    make_targets: {
        "win32": ['zip', 'nsis'], // An array of win32 make targets
//        "win32": ['zip', 'squirrel'], // An array of win32 make targets
        "darwin": ['zip', 'dmg'], // An array of darwin make targets
        "linux": ['zip', 'deb'] // An array of linux make targets
    },
//    packagerConfig: { ... },
//    electronRebuildConfig: { ... },
    electronPackagerConfig: {
        ignore: ["\\.idea", "\\.gitignore", "\\.git", "\\.travis.yml"],
        icon: "build/icon.ico",
    },
    publish: ['github'],
    github_repository: {
        owner: 'michz',
        name: 'simple-scoreboard-matrix',
        prerelease: true,
    },
//    plugins: [ ... ],
//    hooks: { ... },
    buildIdentifier: 'simple-scoreboard-matrix'
};
