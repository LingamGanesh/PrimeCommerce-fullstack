import { createSlice } from '@reduxjs/toolkit'

const initialValue ={
    _id:'',
    email:'',
    name:''
}

const userSlice = createSlice({
    name:'user',
    initialState:initialValue,
    reducers:{
        setUserDetails:(state,action) =>{
           state.name = action.payload.name
        }
    }
})

export const {setUserDetails} = userSlice.actions
export default userSlice.reducer