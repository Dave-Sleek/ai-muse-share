import { Link } from "react-router-dom";
import { Sparkles, Users, Target, Lightbulb, Heart, Zap } from "lucide-react";

const About = () => {
    return (
        <div className="relative">
            {/* Hero Section */}
            <div className="relative overflow-hidden py-24 px-4">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--primary)/0.1),hsl(var(--secondary)/0.1))]" />
                
                <div className="max-w-4xl mx-auto relative">
                    <div className="text-center space-y-6 mb-20">
                        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass-effect">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <span className="text-sm font-medium">About Us</span>
                        </div>
                        
                        <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                            Where Creativity Meets <span className="gradient-text">AI Innovation</span>
                        </h1>
                        
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            PromptShare is a vibrant platform where artists, prompt engineers, and curious minds explore the boundless world of AI-generated art.
                        </p>
                    </div>

                    {/* Feature Cards */}
                    <div className="grid md:grid-cols-3 gap-6 mb-20">
                        <div className="glass-effect p-6 rounded-xl hover-lift group">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 group-hover:shadow-[var(--shadow-glow)] transition-shadow">
                                <Target className="w-6 h-6 text-primary-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Our Mission</h3>
                            <p className="text-sm text-muted-foreground">
                                Democratizing AI creativity for artists of all levels, from beginners to professionals.
                            </p>
                        </div>

                        <div className="glass-effect p-6 rounded-xl hover-lift group">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent to-primary flex items-center justify-center mb-4 group-hover:shadow-[var(--shadow-glow)] transition-shadow">
                                <Users className="w-6 h-6 text-accent-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Global Community</h3>
                            <p className="text-sm text-muted-foreground">
                                Join creators worldwide who are pushing the boundaries of AI-generated art.
                            </p>
                        </div>

                        <div className="glass-effect p-6 rounded-xl hover-lift group">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-secondary to-accent flex items-center justify-center mb-4 group-hover:shadow-[var(--shadow-glow)] transition-shadow">
                                <Lightbulb className="w-6 h-6 text-secondary-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Endless Inspiration</h3>
                            <p className="text-sm text-muted-foreground">
                                Discover, learn, and remix prompts to fuel your creative journey.
                            </p>
                        </div>
                    </div>

                    {/* Main Content Sections */}
                    <div className="space-y-16">
                        {/* Our Story */}
                        <section className="glass-effect p-8 md:p-12 rounded-2xl">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                                    <Heart className="w-5 h-5 text-primary-foreground" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold mb-4">Our Story</h2>
                                    <p className="text-muted-foreground leading-relaxed mb-4">
                                        PromptShare was born from a simple belief: everyone should have access to the incredible creative potential of AI. We saw artists struggling to share their techniques, learners searching for inspiration, and communities yearning for a dedicated space to showcase AI-generated art.
                                    </p>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Today, we're proud to be the home of a thriving global community that's redefining creativity through AI. From stunning visuals to innovative prompts, PromptShare is where imagination comes to life.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Why Choose Us */}
                        <section>
                            <div className="text-center mb-12">
                                <h2 className="text-3xl font-bold mb-4">Why Choose <span className="gradient-text">PromptShare</span>?</h2>
                                <p className="text-muted-foreground">Everything you need to create, share, and discover AI art</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="flex gap-4 p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors">
                                    <Zap className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                                    <div>
                                        <h3 className="font-semibold mb-2">Discover & Remix</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Find amazing prompts and put your own spin on them. Build on the creativity of others and share your unique interpretations.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4 p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors">
                                    <Users className="w-6 h-6 text-secondary flex-shrink-0 mt-1" />
                                    <div>
                                        <h3 className="font-semibold mb-2">Build Your Profile</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Showcase your work, grow your audience, and establish yourself as a creator in the AI art community.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4 p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors">
                                    <Sparkles className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                                    <div>
                                        <h3 className="font-semibold mb-2">Stay Inspired</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Explore trending AI art and fresh prompt ideas daily. Never run out of creative fuel for your next masterpiece.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4 p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors">
                                    <Heart className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                                    <div>
                                        <h3 className="font-semibold mb-2">Connect & Collaborate</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Join discussions, follow your favorite artists, and collaborate with like-minded creators from around the world.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* CTA Section */}
                        <section className="text-center glass-effect p-12 rounded-2xl">
                            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
                            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                                Have questions, feedback, or partnership ideas? We'd love to hear from you.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link 
                                    to="/contact" 
                                    className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                                >
                                    Contact Us
                                </Link>
                                <Link 
                                    to="/gallery" 
                                    className="inline-flex items-center justify-center px-8 py-3 rounded-lg border border-border hover:bg-muted transition-colors font-medium"
                                >
                                    Explore Gallery
                                </Link>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;
