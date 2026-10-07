// Copy .next/standalone to dist/ as plain files, so the bundle can be tarred and run anywhere.
//
// pnpm makes node_modules out of symlinks, and a package finds its dependencies next to its
// real location in node_modules/.pnpm. On Windows, Next writes those links as junctions with
// absolute targets back into the project's own node_modules, and Git Bash can't recreate them
// anyway. So the bundle gets a flat, npm-style node_modules instead: every traced package once,
// as a real directory, which Node resolves the same way on any OS.
//
//   node deploy/copy-standalone.mjs <standalone dir> <dest dir>
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, realpathSync } from "node:fs";
import path from "node:path";

const [src, dest] = process.argv.slice(2).map((p) => path.resolve(p));
const projectRoot = path.resolve(src, "../..");
const pnpmDir = path.join(src, "node_modules", ".pnpm");

// Follow a link; a target inside the project is swapped for its traced copy in standalone/.
function linkTarget(link) {
  const target = path.resolve(path.dirname(link), readlinkSync(link));
  const rel = path.relative(projectRoot, target);
  if (!rel.startsWith("..") && !path.isAbsolute(rel) && !target.startsWith(src + path.sep)) {
    const traced = path.join(src, rel);
    if (existsSync(traced)) return lstatSync(traced).isSymbolicLink() ? linkTarget(traced) : traced;
  }
  return realpathSync(target);
}

function copy(from, to, skip = () => false) {
  const stat = lstatSync(from);
  if (stat.isSymbolicLink()) return copy(linkTarget(from), to);
  if (!stat.isDirectory()) return cpSync(from, to);
  mkdirSync(to, { recursive: true });
  for (const name of readdirSync(from)) {
    if (!skip(name)) copy(path.join(from, name), path.join(to, name));
  }
}

// node_modules is rebuilt below. data/ gets traced by accident (DATA_DIR defaults to ./data),
// and .env files hold secrets; neither belongs in the bundle.
copy(src, dest, (name) => name === "node_modules" || name === "data" || name.startsWith(".env"));

// Package dirs inside a node_modules dir, scoped ones as "@scope/name".
function packagesIn(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    if (name.startsWith(".")) return [];
    if (name.startsWith("@")) return readdirSync(path.join(dir, name)).map((n) => `${name}/${n}`);
    return [name];
  });
}

const version = (dir) => {
  try {
    return JSON.parse(readFileSync(path.join(dir, "package.json"), "utf8")).version;
  } catch {
    return undefined;
  }
};

const hoisted = new Map();
const storeDirs = existsSync(pnpmDir) ? readdirSync(pnpmDir).filter((d) => d !== "node_modules") : [];
const sources = [
  path.join(src, "node_modules"),
  ...storeDirs.map((d) => path.join(pnpmDir, d, "node_modules")),
  path.join(pnpmDir, "node_modules"),
];
for (const modulesDir of sources) {
  for (const name of packagesIn(modulesDir)) {
    const from = path.join(modulesDir, name);
    const real = lstatSync(from).isSymbolicLink() ? linkTarget(from) : from;
    if (hoisted.has(name)) {
      const [have, haveVersion] = hoisted.get(name);
      if (have !== real && haveVersion !== version(real)) {
        console.warn(`warning: ${name}@${version(real)} skipped, bundle has ${name}@${haveVersion}`);
      }
      continue;
    }
    hoisted.set(name, [real, version(real)]);
    copy(real, path.join(dest, "node_modules", name));
  }
}
console.log(`Copied standalone server with ${hoisted.size} packages to ${path.relative(process.cwd(), dest)}`);
