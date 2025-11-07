import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Folder, Lock, Globe, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Collection {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  bookmark_count?: number;
}

const Collections = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCollection, setNewCollection] = useState({
    name: "",
    description: "",
    is_public: false,
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    fetchCollections();
  };

  const fetchCollections = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("collections")
      .select(`
        *,
        bookmarks(count)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const collectionsWithCount = data.map((col) => ({
        ...col,
        bookmark_count: col.bookmarks?.[0]?.count || 0,
      }));
      setCollections(collectionsWithCount);
    }
    setLoading(false);
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("collections").insert({
      user_id: user.id,
      name: newCollection.name,
      description: newCollection.description || null,
      is_public: newCollection.is_public,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create collection",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Collection created successfully",
      });
      setDialogOpen(false);
      setNewCollection({ name: "", description: "", is_public: false });
      fetchCollections();
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    const { error } = await supabase
      .from("collections")
      .delete()
      .eq("id", collectionId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete collection",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Collection deleted",
      });
      fetchCollections();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">My Collections</h1>
              <p className="text-muted-foreground">Organize your saved posts into themed collections</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Collection
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Collection</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateCollection} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Collection Name</Label>
                    <Input
                      id="name"
                      value={newCollection.name}
                      onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
                      placeholder="e.g., Landscape Inspiration"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      value={newCollection.description}
                      onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })}
                      placeholder="What's this collection about?"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="public">Make this collection public</Label>
                    <Switch
                      id="public"
                      checked={newCollection.is_public}
                      onCheckedChange={(checked) => setNewCollection({ ...newCollection, is_public: checked })}
                    />
                  </div>
                  <Button type="submit" className="w-full">Create Collection</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {collections.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Folder className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No collections yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first collection to start organizing your saved posts
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Collection
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((collection) => (
                <Card
                  key={collection.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/collections/${collection.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <Folder className="w-5 h-5" />
                          {collection.name}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {collection.description || "No description"}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCollection(collection.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{collection.bookmark_count} posts</span>
                      <span className="flex items-center gap-1">
                        {collection.is_public ? (
                          <>
                            <Globe className="w-4 h-4" />
                            Public
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            Private
                          </>
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Collections;