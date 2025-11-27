import UserModel from "../models/user.model.js"
import jwt from 'jsonwebtoken';
const generatedRefreshToken = async (userId) =>{
     const token = await jwt.sign({id:userId},
            process.env.SECRET_KEY_REFRESH_TOKEN,
            {expiresIn:'7d'}
        )

  //  check Token in DB Available Or Not
        const updateRefreshTokenUser = await UserModel.updateOne(
            {_id:userId},
            {
                    refresh_token:token
        })

        return token 
      
}
export default generatedRefreshToken