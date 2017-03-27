#! /usr/bin/env node
const process = require("process");
const path = require("path");
const fs = require("fs");
const spawn = require('child_process').spawn;
const yes_no = require("yesno");

const color = {
	color: (color, str) => `${color}${str}\x1b[0m`,
	blue: str => color.color("\x1b[34m", str),
	dim: str => color.color("\x1b[2m", str)
}

const log = {
	plain: str => process.stdout.write(`${str||""}\n`),
	info: str => process.stdout.write(`${color.blue("info")} ${str}`)
}

if (~process.argv.indexOf("--help")) {
	log.plain(`Usage: pkgpurge regex ${color.dim('[path]')}`);
	log.plain(`\n${color.dim('[path]')} defaults to current directory.`);
	log.plain("\nExamples:");
	log.plain(`- pkgpurge "express*"`);
	log.plain(`- pkgpurge "babel*" /workspace/project_directory`);
	return;
}

if (process.argv[3]) {
	try { process.chdir(process.argv[3]); }
	catch (e) { return console.error(`Error: no such directory: ${process.argv[3]}`); }
}




const dir = process.cwd();
const regex = new RegExp(process.argv[2]);

fs.readFile(`${dir}/package.json`, (err, data) => {
	if (err)
		return console.error(err);

	const package = JSON.parse(data);
	const packageList = Object.keys(package.dependencies || {})
		.concat(Object.keys(package.devDependencies || {}))
		.filter(pkg => regex.test(pkg));

	if (packageList.length) {
		log.plain("Removing the following packages:");
		log.plain(color.dim(packageList.join(" ")));
		yes_no.ask('\nProceed?', true, ok => removePackages(packageList));
	}

	else
		log.info("No packages matched the supplied RegExp\n");
});

function removePackages(packageList) {
	fs.access(`${dir}/yarn.lock`, err => {
		const removal = err
			? spawn("npm", ['uninstall'].concat(packageList), {stdio:'inherit'})
			: spawn("yarn", ['remove'].concat(packageList), {stdio:'inherit'});
	});
}
