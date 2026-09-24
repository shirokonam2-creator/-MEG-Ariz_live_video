
const http = require("http");
const fs = require("fs");
const path = require("path");

const {
  getRoom,
  updateRoom
} = require("./cinemaRoom");

const cinemaPublic =
  path.join(__dirname, "public");

function startCinemaServer(port) {

  const server = http.createServer(
    (req, res) => {

      // =========================
      // CINEMA API
      // =========================

      if (req.url.startsWith("/api/cinema/")) {

        const roomId =
          req.url.split("/")[3];

        // GET ROOM
        if (req.method === "GET") {

          const room =
            getRoom(roomId);

          if (!room) {

            res.writeHead(404);
            res.end("Room not found");

            return;
          }

          res.writeHead(200, {
            "Content-Type":
              "application/json"
          });

          res.end(
            JSON.stringify(room)
          );

          return;
        }

        // UPDATE ROOM
        if (req.method === "POST") {

          let body = "";

          req.on(
            "data",
            chunk => {
              body += chunk;
            }
          );

          req.on(
            "end",
            () => {

              try {

                const data =
                  JSON.parse(body);

                const room =
                  updateRoom(
                    roomId,
                    data
                  );

                if (!room) {

                  res.writeHead(404);
                  res.end(
                    "Room not found"
                  );

                  return;
                }

                res.writeHead(200, {
                  "Content-Type":
                    "application/json"
                });

                res.end(
                  JSON.stringify(room)
                );

              } catch (error) {

                res.writeHead(400);
                res.end(
                  "Invalid JSON"
                );
              }
            }
          );

          return;
        }
      }


      // =========================
      // CINEMA PAGE
      // =========================

      if (
        req.url === "/cinema" ||
        req.url.startsWith("/cinema?")
      ) {

        const filePath =
          path.join(
            cinemaPublic,
            "index.html"
          );

        fs.readFile(
          filePath,
          (error, data) => {

            if (error) {

              res.writeHead(500);
              res.end(
                "Cinema error"
              );

              return;
            }

            res.writeHead(200, {
              "Content-Type":
                "text/html; charset=utf-8"
            });

            res.end(data);
          }
        );

        return;
      }


      // =========================
      // CSS
      // =========================

      if (
        req.url === "/cinema.css"
      ) {

        const filePath =
          path.join(
            cinemaPublic,
            "cinema.css"
          );

        fs.readFile(
          filePath,
          (error, data) => {

            if (error) {

              res.writeHead(404);
              res.end();

              return;
            }

            res.writeHead(200, {
              "Content-Type":
                "text/css"
            });

            res.end(data);
          }
        );

        return;
      }


      // =========================
      // JAVASCRIPT
      // =========================

      if (
        req.url === "/cinema.js"
      ) {

        const filePath =
          path.join(
            cinemaPublic,
            "cinema.js"
          );

        fs.readFile(
          filePath,
          (error, data) => {

            if (error) {

              res.writeHead(404);
              res.end();

              return;
            }

            res.writeHead(200, {
              "Content-Type":
                "application/javascript"
            });

            res.end(data);
          }
        );

        return;
      }


      // =========================
      // DEFAULT
      // =========================

      res.writeHead(200, {
        "Content-Type":
          "text/plain; charset=utf-8"
      });

      res.end(
        "Arizu Cinema Live Server is online!"
      );
    }
  );


  server.listen(
    port,
    "0.0.0.0",
    () => {

      console.log(
        `🎬 Cinema Live Server đang chạy trên port ${port}`
      );
    }
  );


  return server;
}


module.exports = {
  startCinemaServer
};
