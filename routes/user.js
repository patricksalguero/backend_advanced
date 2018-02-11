const express  = require('express')
const app      = express()
const bcrypt   = require('bcrypt')
const jwt      = require('jsonwebtoken')

const User     = require('../models/User')
const config   = require('../config/configuration')

const auth     = require('../middlewares/auth')

// ==========================================
// Listado de usuarios
// ==========================================
app.get('/',  (request, response ,nextFunction ) => {

    User.find({} , 'name email img role' ) 
    .exec ( ( err , result ) => {
        if( !err ){
            return response.status(200).json({
                ok : true ,
                users : result
            })
        }
        
        return response.status(500).json({
            ok : false ,
            message: 'Ha ocurrido un error al procesar la información.',
            users : null ,
            errors : err
        })
        
    })
})

// ==========================================
// Agregar un nuevo usuario
// ==========================================
app.post('/', auth.verifyJWT ,(request, response , nextFunction ) => {

    const body = request.body

    const user = new User({
        name : body.name,
        email : body.email,
        password: bcrypt.hashSync(body.password, 10) ,
        img : body.img,
        role : body.role
    })

    user.save( ( err , u ) => {
        if( err ) {
            return response.status(400).json({
                ok : false ,
                message: 'Ha ocurrido un error al procesar la información.',
                errors : err
            })
        }
        u.password = undefined
        return response.status(201).json({
            ok : true ,
            message : 'Correcto POST user',
            user : u
        })

    })

})


// ==========================================
// Actualizar usuario
// ==========================================
app.put('/:id', auth.verifyJWT ,(request, response , nextFunction ) => {

    const body = request.body
    const id   = request.params.id

    User.findById( id , ( err , user ) => {
        if( err ) {
            return response.status(500).json({
                ok : false,
                message : 'Error al buscar usuario.',
                errors : err
            })
        }

        //No encontró usuario
        if( !user ){
            return response.status(400).json({
                ok : false,
                message: 'El usuario con ID: ' + id + ' no existe.',
                errors: { message : 'No existe usuario'}
            })
        }

        user.name = body.name
        user.email = body.email
        user.role  = body.role

        // Grabar usuario encontrado
        user.save( (err , savedU ) => {
            if( err  || !savedU ) {
                return response.status(500).json({
                    ok: false,
                    message: 'Ocurrió un error al actualizar usuario.',
                    errors : err
                })
            }
            user.password = '.|.'
            return response.status(200).json({
                ok : true,
                user: user
            })

        })

    })

})

// ==========================================
// Eliminar un usuario por ID
// ==========================================
app.delete('/:id', auth.verifyJWT, (req, res , nextFunction ) => {
  const id = req.params.id
  
  //   Validar que existe el id en la query
  if( id == null || !id ){
      return res.status(400).json({
          ok : false ,
          message: 'El id del usuario es obligatorio'
      })
  }

  // Buscar y eliminar usuario
  User.findByIdAndRemove( id , ( err , result ) => {
      if( err  ) {
          return res.status(500).json({
              ok: false,
              message: 'Error al eliminar usuario.',
              errors : err 
          })
      }
      // Si usuario no existe
      if( result == null ){
          return res.status(404).json({
              ok : false,
              message: 'Usuario con ID ' + id + ' no encontrado'
          })
      }
      // Usuario existe y se elimina correctamente
      result.password = undefined
      result.role     = undefined
      return res.status(200).json({
          ok : true,
          user : result
      })
  })

})



module.exports = app