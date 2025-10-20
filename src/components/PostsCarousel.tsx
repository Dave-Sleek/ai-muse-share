import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface Post {
  id: string;
  title: string;
  image_url: string;
  user_id: string;
  profiles: {
    username: string;
  };
}

const PostsCarousel = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        profiles(username)
      `)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      setPosts(data);
    }
  };

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12">
          Featured <span className="gradient-text">AI Art</span>
        </h2>
        <Carousel className="w-full">
          <CarouselContent>
            {posts.map((post) => (
              <CarouselItem key={post.id} className="md:basis-1/2 lg:basis-1/3">
                <div
                  className="glass-effect rounded-2xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105"
                  onClick={() => navigate(`/post/${post.id}`)}
                >
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1 truncate">
                      {post.title}
                    </h3>
                    <Link
                      to={`/profile/${post.user_id}`}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors inline-block"
                      onClick={(e) => e.stopPropagation()}
                    >
                      by {post.profiles.username}
                    </Link>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </section>
  );
};

export default PostsCarousel;