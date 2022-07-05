let fs = require('fs')
	, config = require('./config.json')
	, saveConfig = () => {fs.writeFile('./config.json',  JSON.stringify(config), 'utf8', () => {})}
	, win
	;

const DiscordRPC = require('discord-rpc')
		, rpc = new DiscordRPC.Client({transport: 'ipc'})
		, {app, BrowserWindow, Menu, remote, globalShortcut } = require('electron')
		;

DiscordRPC.register(config.clientId);

const menuTemplate = [
	{
		label: "Interface",
		submenu: [
			{role: "Reload"},
			{role: "toggleDevTools"},
			{label: 'Enable RPC', type: 'checkbox', checked: config.state ? true : false, click: () => {config.state = config.state ? false : true; saveConfig()}}
		]
	}
];

app.on('ready', () => {
	// Create the browser window.
	win = new BrowserWindow({
		width: 800, 
		height: 700, 
		show: false, 
		webPreferences: {
			nodeIntegration: false
		},
		autoHideMenuBar: true
	});
	win.webContents.on('new-window', function(e, url) {
		e.preventDefault();
		require('electron').shell.openExternal(url);
	  });
	win.setMinimumSize(300, 300);
	win.setSize(800, 700);
	win.setResizable(true);
	// Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
	win.once('ready-to-show', () => {win.show()});


  globalShortcut.register('MediaPlayPause', () => {
	win.webContents.executeJavaScript('togglePlay()');
	console.log('MediaPlayPause is pressed')
	return;
  });
  console.log('MediaPlayPause', globalShortcut.isRegistered('MediaPlayPause'));

	win.on('closed', () => {win = null;});
	win.loadURL(`https://${config.source}`);
});

app.on('window-all-closed', () => {globalShortcut.unregisterAll(); rpc.destroy(); app.quit();})


function setActivity() {
	if (!rpc || !win || !config.state) return;

	yaderi();
}

async function yaderi() {
	let data = await win.webContents.executeJavaScript('document.getElementById("songtitle").innerHTML');
	let state = await win.webContents.executeJavaScript('isPlaying()');
	let artist = data.split(' - ')[0]
	let title = data.split(' - ')[1]

	rpc.setActivity({
		details: artist,
		state: title,
		largeImageKey: 'yaderi',
		largeImageText: 'HyperYaderi.ru',
		smallImageKey: state ? 'true' : 'false',
		smallImageText: state ? 'Слушает' : 'На паузе'
	})
}

rpc.on('ready', () => {
  console.log('Authed for user', rpc.user.username);

	rpc.setActivity({
    details: 'Запускается...',
    state: 'Загрузка плеера',
    smallImageKey: 'pause',
    smallImageText: 'На паузе'
  })
	setInterval(() => setActivity(), 5e3);
});

rpc.login({clientId: config.clientId}).catch(console.error);