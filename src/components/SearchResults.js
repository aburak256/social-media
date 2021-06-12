export class SearchResults extends Component {
    state={
        text: '',
        topics: [],
        posts: [],
        users: [],
        loading: true,
        selection: null
    }

    async componentDidMount(){
        const myInit = {
            queryStringParameters:{
              search: this.props.text
            }
          }
        const path = '/search/' 
        const data = await API.get(`topicsApi`, path, myInit)
        console.log(data)
        if(data['topics'] != null){
            this.setState({topics: data['topics']})
        }
        if(data['posts'] != null){
            this.setState({posts: data['posts']})
        }
        if(data['usernames'] != null){
            this.setState({users: data['usernames']})
        }
        this.setState({ loading:false})       
    }

