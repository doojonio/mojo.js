import * as util from './../util.js';

export default async function genLiteAppCommand (app, args) {
  const stdout = process.stdout;
  stdout.write('Generating single file application:\n');
  await util.cliCreateFile(args[1] ?? 'index.js', liteApp, {}, {chmod: 0o744});
  await util.cliFixPackage();
  stdout.write(tip);
}

genLiteAppCommand.description = 'Generate single file application';
genLiteAppCommand.usage = `Usage: APPLICATION gen-lite-app [OPTIONS] [NAME]

  node index.js gen-lite-app
  node index.js gen-lite-app myapp.js

Options:
  -h, --help   Show this summary of available options
`;

const tip = `
Tip: Single file applications are best used for prototyping, for anything more
     complicated we recommend the use of a full mojo.js application.
`;

const liteApp = `#!/usr/bin/env node
import mojo from '@mojojs/mojo';

const app = mojo();

app.any('/', async ctx => {
  await ctx.render({inline: indexTemplate, inlineLayout: defaultLayout}, {title: 'Welcome'});
});

app.websocket('/heading', ctx => {
  ctx.on('connection', ws => {
    ws.send('Welcome to the mojo.js real-time web framework!');
  });
});

app.start();

const indexTemplate = \`
<h1>Waiting...</h1>
<script>
  const ws = new WebSocket('<%%= ctx.urlFor('heading') %%>');
  ws.onmessage = event => { document.querySelector('h1').innerHTML = event.data };
</script>
\`;

const defaultLayout = \`
<!DOCTYPE html>
<html>
  <head>
    <%%- ctx.mojoFaviconTag() %%>
    <title><%%= title %%></title>
  </head>
  <body><%%- view.content %%></body>
</html>
\`;
`;
