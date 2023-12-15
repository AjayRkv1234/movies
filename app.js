const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())
const dbpath = path.join(__dirname, 'moviesData.db')

let db = null

const initializeDBaAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBaAndServer()

const convertMovieNameToPascalCase = dbObject => {
  return {
    movieName: dbObject.movie_name,
  }
}

//API 1 Return a list of all movie names in the movie table
app.get('/movies/', async (request, response) => {
  const getMovieQuery = `SELECT movie_name FROM movie;`
  const movieArray = await db.all(getMovieQuery)
  response.send(
    movieArray.map(movieName => convertMovieNameToPascalCase(movieName)),
  )
})

//API 2 create a new movie in the table
app.post('/movies/', async (request, response) => {
  const movieDetails = request.body
  const {directorId, movieName, leadActor} = movieDetails
  const postMovieQuery = `INSERT INTO movie (director_id, movie_name, lead_actor)
        VALUES (${directorId}, "${movieName}", "${leadActor}");`
  const dbResponse = await db.run(postMovieQuery)
  //console.log(dbResponse)
  response.send('Movie Successfully Added')
})

//to convert to pascalCase
const convertDbObjectToResponseObject = dbObject => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  }
}

//API 3 return a movie based on movie_Id
app.get('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const getMovieQuery = `SELECT
                              movie_id as movieId,
                              director_id as directorId,
                              movie_name as movieName,
                              lead_actor as leadActor
                         FROM movie WHERE movie_id = ${movieId};`
  const movie = await db.get(getMovieQuery)
  response.send(movie)
})

//API 4 Update the details of a movie in the table based on the movie ID
app.put('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const movieDetails = request.body
  const {directorId, movieName, leadActor} = movieDetails
  const updateMovieQuery = `UPDATE movie SET director_id = ${directorId}, movie_name = "${movieName}", lead_actor = "${leadActor}" 
        WHERE movie_id = ${movieId};`
  await db.run(updateMovieQuery)
  response.send('Movie Details Updated')
})

//API 5 Movie deleted
app.delete('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const deleteMovieQuery = `DELETE FROM  movie 
        WHERE movie_id = ${movieId};`
  await db.run(deleteMovieQuery)
  response.send('Movie Removed')
})
const convertDirectorDetailsPascalCase = dbObject => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  }
}

//API 6 returns a list of all the directors
app.get('/directors/', async (request, response) => {
  const getdirectorQuery = `SELECT * FROM director;`
  const directorArray = await db.all(getdirectorQuery)
  response.send(
    directorArray.map(eachDirector =>
      convertDirectorDetailsPascalCase(eachDirector),
    ),
  )
})

const convertMovieNamePascalCase = dbObject => {
  return {
    movieName: dbObject.movie_name,
  }
}

//API 7 Return a list of all movie names
app.get('/directors/:directorId/movies/', async (request, response) => {
  const {directorId} = request.params
  const getDirectorMovieQuery = `SELECT 
                                movie_name 
                                FROM 
                                director INNER JOIN movie 
                                ON director.director_id = movie.director_id 
                                WHERE 
                                director.director_id = ${directorId};`
  const moviesArray = await db.all(getDirectorMovieQuery)
  console.log(directorId)
  response.send(
    moviesArray.map(movienames => convertMovieNamePascalCase(movienames)),
  )
})

module.exports = app
