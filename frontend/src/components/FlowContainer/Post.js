import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';

export default function Post ({ content }) {
  return (
    <Card className='post card'>
      <CardContent>
        <div className='postTitle'>
          <h1>
            {content.title}
          </h1>
        </div>
        <hr />
        <div className='postBody' dangerouslySetInnerHTML={{ __html: content.body }} />
      </CardContent>
    </Card>
  );
}
