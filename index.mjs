import fetch from 'node-fetch';
import fs from 'fs';
import express from 'express';
import {fileURLToPath} from 'url';
import path from 'path'
import connectBusboy from 'connect-busboy';
import gifFrames from 'gif-frames';
import serveStatic from 'serve-static';
const app = express();


const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, 'public');

const SECRET = "secret";


app.get("/emojis/:emojiname", (req, res, next) => {
  if (!req.query) return next()
  const type = req.query.type;
  if (!type) return next()
  
  const emojiname = req.params.emojiname;
  const dir = path.join(publicDir,"emoji_dir", emojiname);

  res.set('Cache-Control', 'public, max-age=31536000');
  res.set('Accept-Ranges', 'bytes');
  res.header("Content-Type", "image/png");

  gifFrames({ url: dir, frames: 0, outputType: 'png' }).then(function (frameData) {
    frameData[0].getImage().pipe(res)
  }).catch(_ => {next()})
})


app.use("/emojis", serveStatic(path.join(publicDir, "emoji_dir"), {
  maxAge: '1d',
  setHeaders: headerControl
}))


app.get("/:userid/:fileid/:filename", (req, res, next) => {
  //{"userid":"763085765093499319","fileid":"6655044887131459584","filename":"cat"}
  if (!req.query) return next()
  const type = req.query.type;
  if (!type) return next()
  const userid = req.params.userid;
  const fileid = req.params.fileid;
  const filename = req.params.filename;
  const dir = path.join(publicDir, "files", userid, fileid, filename);

  res.set('Cache-Control', 'public, max-age=31536000');
  res.set('Accept-Ranges', 'bytes');
  res.header("Content-Type", "image/png");

  gifFrames({ url: dir, frames: 0, outputType: 'png' }).then(function (frameData) {
    frameData[0].getImage().pipe(res)
  }).catch(_ => {next()})

})


app.use(serveStatic(path.join(publicDir, "files"), {
  maxAge: '1d',
  setHeaders: headerControl
}))


function headerControl (res, p) {
  if (!serveStatic.mime.lookup(p).startsWith('image')) {
    res.setHeader('Content-disposition', 'attachment; filename=' + path.basename(p));
    
} else {
      res.set('Cache-Control', 'public, max-age=31536000');
  }
}


app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
})

// use json as body parser
app.use(express.json());


app.delete("/indexx-remove.php", (req, res) => {
  const {removePath, secret} = req.body;
  if (secret !== SECRET) {
    res.status(403).send("Invalid secret.");
    return;
  }
  if (!removePath) {
    res.status(403).send("Target Path not provided.");
    return;
  }

  const relativePath = path.join(publicDir, "files", removePath);


  if (!existsSync(relativePath)) {
    res.status(403).send("File does not exist.");
    return;
  }
  if (!fs.lstatSync(relativePath).isFile()) {
    res.status(403).send("Not a file.");
    return;
  }

  fs.unlinkSync(relativePath);
  res.send("File deleted.");
})


app.post("/indexx.php", connectBusboy({immediate: true, limits: {files: 1, fileSize: 7840000}}),  async (req, res) => {

  const data = {
    userid: null,
    fileid: null,
    isemoji: null,
    secret: null,
    fileToUpload: null
  }

  let dir = null;
  let fileDir = null;

  req.busboy.on('file', (name, file, info) => {
      data.fileToUpload = file;
      if (data.secret !== SECRET) {
        res.status(403).send("Invalid secret.");
        return;
      }

      if (data.isemoji === "1") {
        dir = path.join(publicDir, "emoji_dir/");
      } else {
        dir = path.join(publicDir, "files/", data.userid, "/", data.fileid, "/");
      }

      fileDir = path.join(dir, info.filename);
      if (!existsSync(dir)) {
        fs.mkdirSync(dir, {recursive: true});
      }
      if (!isImage(info.mimeType)) {
        res.status(403).send("Nertivia CDN only supports WEBP, JPG, JPEG, PNG & GIF formats for now.");
        return;
      }
      
      if (existsSync(fileDir)) {
        res.status(403).send("File already exists.");
        return;
      }
      data.fileToUpload = file;
      file.pipe(fs.createWriteStream(fileDir));
  });
  req.busboy.on('field', (name, value, info) => {
    data[name] = value;
  });
  req.busboy.on('close', () => {
    if (data.fileToUpload?.truncated) {
      res.status(403).send("Nertivia CDN max file upload is 7MB for now.");
      fs.unlinkSync(fileDir);
      return;
    }
    if (data.fileToUpload) {
      res.status(200).send("File uploaded.");
    }
  })

  req.busboy.on('finish', () => {
    if (!data.fileToUpload) {
      res.status(403).send("No file to upload.");
    }
  });


})


app.get('/proxy.php', async (req, res) => {

  res.header("Access-Control-Allow-Origin", "https://nertivia.net");
  res.header('Cache-Control', 'public, max-age=31536000');
  res.header('Access-Control-Allow-Origin', 'https://nertivia.net');



  const url = req.query.url;

  if (!url || !isUrl(url)) {
    res.status(403).end();
    return;
  }

  if (url === "https://media.nertivia.net") {
    res.redirect(url);
    return;
  }



  const mime = await getMime(url);

  if (!isImage(mime)) {
    res.status(403).end();
    return;
  }

  res.header('Content-Type', mime);

  const img = await fetch(url).catch(err => console.log(err));
  const imgData = await img.buffer();
  res.send(imgData);

});



app.all("/*", (res, req) => {
  req.status(404).send("Invalid Image.")
})


app.listen(8002, () => {
  console.log('Nertivia CDN is listening on port 8080');
})


function isUrl (url) {
  if (url.startsWith("https://") || url.startsWith("http://")) {
    return true;
  }
}
// get image mime type by url
async function getMime (url) {
  const res = await fetch(url).catch(err => console.log(err));
  const type = res.headers.get('content-type');
  return type;
}




function isImage(mime){
	const availableMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

  if (availableMimes.includes(mime)) {
    return true;
  }
}

function existsSync (dir) {
  try {
    return fs.existsSync(dir)
  } catch (err) {
    return false 
  }
}