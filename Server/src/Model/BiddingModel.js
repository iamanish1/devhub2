import mongooes from 'mongoose'; 
import { ProjectListingSchema } from './ProjectListingModel.js';
import { UserSchema } from './UserModel.js';


const BiddingSchema = new mongooes.Schema({
project_id : {
    type : mongooes.Schema.Types.ObjectId,
    ref : ProjectListingSchema,
    required : true
},
user_id : {
    type : mongooes.Schema.Types.ObjectId,
    ref : UserSchema,
    required : true
},
bid_amount : {
    type : Number,
    required : true
},
year_of_experience : {
    type : Number,
    required : true
},
bid_description : {
    type : String,
    required : true
},
hours_avilable_per_week : {
    type : Number,
    required : true
},
skills : {
    type : [String],
    required : true
},

bid_status : {
    type : String,
    enum : ['Pending', 'Accepted', 'Rejected'],
    default : 'Pending'
},
created_at : {
    type : Date,
    default : Date.now
},
})

const Bidding = mongooes.model('Bidding', BiddingSchema);
export default Bidding ;  // exporting the Bidding Model for use in other files.