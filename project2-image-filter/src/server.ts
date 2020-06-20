import express, { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import bodyParser from 'body-parser';
import {filterImageFromURL, deleteLocalFile} from './util/util';
import { config } from './config/config';
const morgan = require('morgan');
import status from 'http-status';

(async () => {
  Sentry.init({ dsn: config.sentry.dsn });

  // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8082;
  
  // Use the body parser middleware for post requests
  app.use(bodyParser.json());

  // use morgan logger
  // :remote-addr :remote-user [:date[iso]] :method :url HTTP/:http-version :status :res[content-length] - :response-time ms
  app.use(morgan(config.morgan.format));

  // @TODO1 IMPLEMENT A RESTFUL ENDPOINT
  // GET /filteredimage?image_url={{URL}}
  // endpoint to filter an image from a public url.
  // IT SHOULD
  //    1
  //    1. validate the image_url query
  //    2. call filterImageFromURL(image_url) to filter the image
  //    3. send the resulting file in the response
  //    4. deletes any files on the server on finish of the response
  // QUERY PARAMATERS
  //    image_url: URL of a publicly accessible image
  // RETURNS
  //   the filtered image file [!!TIP res.sendFile(filteredpath); might be useful]

  /**************************************************************************** */
  app.get("/filteredimage", async ( req: Request, res: Response ) => {
    const { image_url } = req.query;

    // 1. validate the image_url query
    if ( !image_url ) {
      return res.status(status.BAD_REQUEST).send(status['400_MESSAGE'] + " `image_url` query parameter is required.");
    }

    // 2. call filterImageFromURL(image_url) to filter the image
    const filtered_image_url: string = await filterImageFromURL(image_url);

    // 3. send the resulting file in the response
    return res.sendFile(filtered_image_url, function (err) {
      // 4. deletes any files on the server on finish of the response
      deleteLocalFile(filtered_image_url);

      if (err) {
        const errorMsg: string = "error while sending filtered image of " + image_url;
        console.error(errorMsg, " : " + filtered_image_url); 
        return res.status(status.UNPROCESSABLE_ENTITY).send(status['422_MESSAGE'] + ' ' + errorMsg);
      }
    });
  });
  //! END @TODO1
  
  // Root Endpoint
  // Displays a simple message to the user
  app.get( "/", async ( req, res ) => {
    res.send("try GET /filteredimage?image_url={{}}")
  } );
  

  // Start the Server
  app.listen( port, () => {
      console.log( `server running http://localhost:${ port }` );
      console.log( `press CTRL+C to stop server` );
  } );
})();