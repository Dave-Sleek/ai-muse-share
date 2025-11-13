const About = () => {
    return (
        <div className="max-w-4xl mx-auto px-4 py-16">
            <h1 className="text-4xl font-bold mb-6 text-primary">About PromptShare</h1>
            <p className="text-lg text-muted-foreground mb-6">
                PromptShare is a vibrant platform where creativity meets cutting-edge AI. We empower artists, prompt engineers, and curious minds to explore the world of AI-generated art by sharing their creations and the prompts behind them.
            </p>

            <h2 className="text-2xl font-semibold mt-10 mb-4">Our Mission</h2>
            <p className="text-muted-foreground mb-6">
                Our mission is to democratize access to AI creativity. Whether you're a seasoned digital artist or just starting out, PromptShare provides a space to showcase your work, learn from others, and spark new ideas through prompt sharing.
            </p>

            <h2 className="text-2xl font-semibold mt-10 mb-4">Our Community</h2>
            <p className="text-muted-foreground mb-6">
                We believe in the power of community. PromptShare is home to creators from around the globe who are passionate about pushing the boundaries of what's possible with AI. Join discussions, follow your favorite artists, and contribute to a growing library of inspiration.
            </p>

            <h2 className="text-2xl font-semibold mt-10 mb-4">Why PromptShare?</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Discover and remix prompts to fuel your own creations</li>
                <li>Build your profile and grow your audience</li>
                <li>Stay inspired with trending AI art and prompt ideas</li>
                <li>Collaborate and connect with like-minded creators</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-10 mb-4">Get in Touch</h2>
            <p className="text-muted-foreground">
                Have questions, feedback, or partnership ideas? We'd love to hear from you! Visit our <a href="/contact" className="text-primary underline">Contact</a> page or email us at <a href="mailto:support@promptshare.ai" className="text-primary underline">support@promptshare.ai</a>.
            </p>
        </div>
    );
};

export default About;
