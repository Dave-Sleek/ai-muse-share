import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Bookmark, BookmarkCheck, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Collection {
  id: string;
  name: string;
  has_bookmark: boolean;
}

interface BookmarkButtonProps {
  postId: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
}

const BookmarkButton = ({ postId, variant = "ghost", size = "default", showLabel = true }: BookmarkButtonProps) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [showNewCollection, setShowNewCollection] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkBookmarkStatus();
  }, [postId]);

  const checkBookmarkStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", user.id)
      .eq("post_id", postId)
      .limit(1);

    setIsBookmarked(!!data && data.length > 0);
  };

  const fetchCollections = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: collectionsData } = await supabase
      .from("collections")
      .select("id, name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (collectionsData) {
      const collectionsWithBookmarks = await Promise.all(
        collectionsData.map(async (col) => {
          const { data: bookmarkData } = await supabase
            .from("bookmarks")
            .select("id")
            .eq("collection_id", col.id)
            .eq("post_id", postId)
            .limit(1);

          return {
            ...col,
            has_bookmark: !!bookmarkData && bookmarkData.length > 0,
          };
        })
      );
      setCollections(collectionsWithBookmarks);
    }
  };

  const handleBookmarkClick = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    await fetchCollections();
    setDialogOpen(true);
  };

  const handleToggleCollection = async (collectionId: string, currentlyBookmarked: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (currentlyBookmarked) {
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("post_id", postId)
        .eq("collection_id", collectionId);

      if (!error) {
        toast({
          title: "Removed",
          description: "Post removed from collection",
        });
        fetchCollections();
        checkBookmarkStatus();
      }
    } else {
      const { error } = await supabase
        .from("bookmarks")
        .insert({
          user_id: user.id,
          post_id: postId,
          collection_id: collectionId,
        });

      if (!error) {
        toast({
          title: "Saved",
          description: "Post added to collection",
        });
        fetchCollections();
        checkBookmarkStatus();
      }
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: newCollection, error } = await supabase
      .from("collections")
      .insert({
        user_id: user.id,
        name: newCollectionName,
      })
      .select()
      .single();

    if (!error && newCollection) {
      await supabase.from("bookmarks").insert({
        user_id: user.id,
        post_id: postId,
        collection_id: newCollection.id,
      });

      toast({
        title: "Success",
        description: "Collection created and post added",
      });
      setNewCollectionName("");
      setShowNewCollection(false);
      fetchCollections();
      checkBookmarkStatus();
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleBookmarkClick}
      >
        {isBookmarked ? (
          <BookmarkCheck className="w-4 h-4" />
        ) : (
          <Bookmark className="w-4 h-4" />
        )}
        {showLabel && size !== "icon" && (
          <span className="ml-2">{isBookmarked ? "Saved" : "Save"}</span>
        )}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save to Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {collections.length === 0 && !showNewCollection ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  You don't have any collections yet
                </p>
                <Button onClick={() => setShowNewCollection(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Collection
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {collections.map((collection) => (
                    <div
                      key={collection.id}
                      className="flex items-center space-x-2 p-2 hover:bg-accent rounded-lg"
                    >
                      <Checkbox
                        id={collection.id}
                        checked={collection.has_bookmark}
                        onCheckedChange={() =>
                          handleToggleCollection(collection.id, collection.has_bookmark)
                        }
                      />
                      <Label
                        htmlFor={collection.id}
                        className="flex-1 cursor-pointer"
                      >
                        {collection.name}
                      </Label>
                    </div>
                  ))}
                </div>

                {!showNewCollection && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowNewCollection(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Collection
                  </Button>
                )}
              </>
            )}

            {showNewCollection && (
              <div className="space-y-2">
                <Label htmlFor="newCollection">Collection Name</Label>
                <div className="flex gap-2">
                  <Input
                    id="newCollection"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="e.g., Landscape Inspiration"
                    onKeyPress={(e) => e.key === "Enter" && handleCreateCollection()}
                  />
                  <Button onClick={handleCreateCollection}>Create</Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookmarkButton;