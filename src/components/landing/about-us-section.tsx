
import Image from 'next/image';

export function AboutUsSection() {
  return (
    <section id="about-us-section" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-6">
              About Our Company
            </h2>
            <p className="text-lg text-muted-foreground mb-4">
              We are a forward-thinking technology company specializing in creating bespoke digital solutions. Our mission is to empower businesses by transforming their innovative ideas into reality through cutting-edge technology and user-centric design.
            </p>
            <p className="text-lg text-muted-foreground mb-4">
              Our team consists of experienced developers, designers, and strategists who are passionate about problem-solving and dedicated to delivering excellence. We believe in collaboration, transparency, and building long-lasting partnerships with our clients.
            </p>
            <p className="text-lg text-muted-foreground">
              From startups to established enterprises, we tailor our services to meet unique challenges and drive growth.
            </p>
          </div>
          <div className="relative h-80 md:h-[450px] rounded-xl shadow-xl overflow-hidden">
            <Image
              src="https://picsum.photos/700/500?random=5"
              alt="Our dedicated team working"
              layout="fill"
              objectFit="cover"
              className="rounded-xl"
              data-ai-hint="office team"
            />
             <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
