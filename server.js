const http = require("http");
const app = require("./app")
const port =4200;

const server = http.createServer(app)

server.listen(port,()=>{
    console.log(`app is running on port ${port}`)
})