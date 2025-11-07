import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Users, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-indian-students.jpg";
import featureMatching from "@/assets/feature-matching.jpg";
import featureChat from "@/assets/feature-chat.jpg";
import featureCommunity from "@/assets/feature-community.jpg";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Students connecting on campus" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background"></div>
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">IIT Ropar's Friend-Making Platform</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Connect<span className="text-primary">Up</span>
          </h1>
          
          <p className="text-2xl md:text-3xl font-semibold mb-4 text-foreground/90 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Swipe. Match. Connect.
          </p>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.3s' }}>
            Make new friends at IIT Ropar who share your interests and hobbies
          </p>
          
          <div className="flex gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              Get Started
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Why ConnectUp?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group relative overflow-hidden rounded-2xl bg-card hover:shadow-2xl transition-all duration-300">
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={featureMatching} 
                  alt="Smart matching for students"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
              </div>
              <div className="p-8 relative z-10 -mt-20">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Smart Matching</h3>
                <p className="text-muted-foreground">
                  Swipe through profiles and match with students who share your interests and hobbies
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl bg-card hover:shadow-2xl transition-all duration-300">
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={featureChat} 
                  alt="Real-time chat with matches"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
              </div>
              <div className="p-8 relative z-10 -mt-20">
                <div className="w-16 h-16 bg-gradient-to-br from-secondary to-accent rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Real-Time Chat</h3>
                <p className="text-muted-foreground">
                  Start conversations instantly with your matches through our built-in messaging system
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl bg-card hover:shadow-2xl transition-all duration-300">
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={featureCommunity} 
                  alt="Campus community at IIT Ropar"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
              </div>
              <div className="p-8 relative z-10 -mt-20">
                <div className="w-16 h-16 bg-gradient-to-br from-accent to-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Campus Community</h3>
                <p className="text-muted-foreground">
                  Connect exclusively with IIT Ropar students and build lasting friendships
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-white">Ready to Make New Friends?</h2>
          <p className="text-xl text-white/90 mb-8">
            Join ConnectUp today and start building meaningful connections at IIT Ropar
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => navigate('/auth')}
            className="text-lg px-12 py-6 rounded-full shadow-xl hover:scale-105 transition-transform bg-white text-primary hover:bg-white/90"
          >
            Join Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 ConnectUp - IIT Ropar. Made with ❤️ for building friendships.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
