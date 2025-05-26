const express = require('express');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const cors = require('cors');
const passport = require('passport');
const httpStatus = require('http-status');
const config = require('./config/config');
const morgan = require('./config/morgan');
const { jwtStrategy } = require('./config/passport');
const { authLimiter } = require('./middlewares/rateLimiter');
const routes = require('./routes/v1');
const { errorConverter, errorHandler } = require('./middlewares/error');
const ApiError = require('./utils/ApiError');
const uploader = require('express-fileupload');
const path = require('path');


const app = express();

// app.get('/sitemap.xml', async (req, res) => {
//   const links = [
//     { url: '/', changefreq: 'daily', priority: 1.0 },
//     { url: '/products', changefreq: 'weekly', priority: 0.8 },
//     { url: '/about-us', changefreq: 'monthly', priority: 0.5 },
//     // You can dynamically generate these based on DB products/blogs
//   ];

//   const stream = new SitemapStream({ hostname: 'https://crystovajewels.com' });
//   res.writeHead(200, { 'Content-Type': 'application/xml' });

//   const xml = await streamToPromise(Readable.from(links).pipe(stream)).then((data) =>
//     data.toString()
//   );

//   res.end(xml);
// });


if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json({ limit: 'Infinity' }));

// parse urlencoded request body
app.use(express.urlencoded({ limit: 'Infinity', extended: true }));

// sanitize request data
app.use(xss());
app.use(mongoSanitize());

// gzip compression
app.use(compression());

// enable cors
app.use(cors());
app.options('*', cors());

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

app.use((req, res, next) => {
  res.header('Host', '*'); // Allow access from any origin
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Expose-Headers', 'Content-Length');
  req.headers.host = "https://4fd2-2402-a00-162-d066-7949-5f68-f64d-f490.ngrok-free.app"

  next();

});

// app.use(express.static(path.resolve("./public")));
// app.use(express.static(path.resolve("./images")));

app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/images', express.static(path.join(__dirname, '..','public','images'))); 

app.use(uploader({
  safeFileNames: true,
  preserveExtension: true,
  // limits: {
  //   fileSize: 100 * 1024 * 1024,
  // },
  useTempFiles: true,
  tempFileDir: '/tmp/uploads',
  abortOnLimit: true,
  responseOnLimit: 'File size limit has been reached',
  httpErrorCode: 400,
  useDateFolder: true,
  createParentPath: true
}));


// limit repeated failed requests to auth endpoints
if (config.env === 'production') {
  app.use('/v1/auth', authLimiter);
}

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// v1 api routes
app.use('/api/v1', routes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

app.use(cors({
  origin: 'http://localhost:3001', // Allow your client to make requests
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

module.exports = app;
