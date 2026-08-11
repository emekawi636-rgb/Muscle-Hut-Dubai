Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force; Start-Sleep 1;
$script = @'
var http = require("http"), fs = require("fs"), path = require("path");
var root = process.cwd();
var types = { ".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".jpg":"image/jpeg", ".webp":"image/webp", ".svg":"image/svg+xml", ".xml":"application/xml", ".txt":"text/plain; charset=utf-8" };
http.createServer(function(req, res) {
    var p = path.normalize(path.join(root, decodeURIComponent(req.url.split("?")[0])));
    if (!p.startsWith(root)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, "index.html");
    fs.readFile(p, function(err, data) {
        if (err) { res.writeHead(404); return res.end("404"); }
        res.writeHead(200, { "Content-Type": types[path.extname(p).toLowerCase()] || "application/octet-stream" });
        res.end(data);
    });
}).listen(8433, function() { console.error("serving on http://localhost:8433"); });
'@
Set-Content -Path "$env:TEMP\opencode\server.js" -Value $script;
Start-Process node -ArgumentList "$env:TEMP\opencode\server.js" -WorkingDirectory "C:\Users\ehabm\Desktop\Muscle Hut Dubai" -WindowStyle Hidden -RedirectStandardError "$env:TEMP\opencode\server-err.log" -PassThru;
