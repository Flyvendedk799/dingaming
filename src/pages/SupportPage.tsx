import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Mail, 
  MessageCircle, 
  HelpCircle, 
  Key, 
  RefreshCw, 
  CreditCard,
  Clock,
  Send,
  CheckCircle2,
  Zap
} from "lucide-react";
import { toast } from "sonner";

const faqs = [
  {
    question: "Hvordan aktiverer jeg min spilnøgle?",
    answer: "Efter køb modtager du din nøgle øjeblikkeligt. Gå til Steam/PlayStation Store/Xbox Store, find 'Indløs kode' og indtast din nøgle. Spillet vil derefter blive tilføjet til dit bibliotek.",
  },
  {
    question: "Hvor hurtigt får jeg min nøgle?",
    answer: "Alle nøgler leveres øjeblikkeligt! Så snart din betaling er bekræftet, vil du modtage din nøgle på email og i din konto på vores hjemmeside.",
  },
  {
    question: "Hvad hvis min nøgle ikke virker?",
    answer: "Kontakt vores support med din ordrebekræftelse, og vi vil undersøge sagen. Hvis nøglen er defekt, får du enten en ny nøgle eller fuld refundering.",
  },
  {
    question: "Kan jeg få refundering?",
    answer: "Ja, vi tilbyder refundering inden for 14 dage, så længe nøglen ikke er aktiveret. Kontakt support med din ordrebekræftelse for at starte processen.",
  },
  {
    question: "Virker nøglerne i Danmark?",
    answer: "Ja! Alle vores nøgler er globale eller specifikt til EU-regionen, hvilket betyder de virker perfekt i Danmark og resten af Europa.",
  },
  {
    question: "Hvilke betalingsmetoder accepterer I?",
    answer: "Vi accepterer de fleste betalingsmetoder inkl. Visa, Mastercard, PayPal, MobilePay, og flere. Alle betalinger er sikre og krypterede.",
  },
];

const SupportPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success("Besked sendt!", {
      description: "Vi vender tilbage hurtigst muligt."
    });
    
    setName("");
    setEmail("");
    setMessage("");
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      

      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-heading text-4xl md:text-5xl text-foreground mb-4">
            Support & Hjælp
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Vi er her for at hjælpe dig! Find svar i vores FAQ eller kontakt os direkte.
          </p>
        </motion.div>

        {/* Quick Help Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            { icon: Key, title: "Aktiveringsguide", desc: "Trin-for-trin vejledning" },
            { icon: RefreshCw, title: "Refundering", desc: "14 dages returret" },
            { icon: Clock, title: "Hurtig levering", desc: "Keys sendt på 30 sek" },
          ].map((item, index) => (
            <motion.div
              key={item.title}
              className="p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading text-lg text-foreground mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* FAQ Section */}
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <HelpCircle className="w-6 h-6 text-primary" />
              <h2 className="font-heading text-2xl text-foreground">
                Ofte stillede spørgsmål
              </h2>
            </div>
            
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-card border border-border rounded-xl px-4 data-[state=open]:border-primary/30"
                >
                  <AccordionTrigger className="text-left text-foreground hover:text-primary hover:no-underline py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.section>

          {/* Contact Form */}
          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <MessageCircle className="w-6 h-6 text-primary" />
              <h2 className="font-heading text-2xl text-foreground">
                Kontakt os
              </h2>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    Navn
                  </label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dit navn"
                    required
                    className="bg-background"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="din@email.dk"
                    required
                    className="bg-background"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                    Besked
                  </label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Beskriv dit spørgsmål eller problem..."
                    rows={5}
                    required
                    className="bg-background resize-none"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Zap className="w-4 h-4 mr-2 animate-pulse" />
                      Sender...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send besked
                    </>
                  )}
                </Button>
              </form>

              {/* Contact Info */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">support@wgaming.dk</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground mt-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="text-sm">Svar inden for 24 timer</span>
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SupportPage;